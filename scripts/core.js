const ui = global.ui;
const fast = require("pictologic/fast");

const core = {
	// settings //
	display: Blocks.logicDisplay,
	size: Blocks.logicDisplay.displaySize,
	speed: LExecutor.maxInstructions,
	quality: 255,
	hsv: false,
	useGray: false,
	
	code: 0, // code.length
	tiles: Seq(),
	DispX: [],
	DispY: [],
	xDisplays: 1,
	yDisplays: 1,
	usedMass: [],
	offset: 6,
	name: "",

	AllIn: [], // Seq Array of 
	DisplaysPerProc: [], // Array of Indexes

	stage: "",
	settings: null,
	image: null
};
const cst = {
	processors: []
	exceptionIND: []
}
core.SetName = name => {
  core.name = name;
};
const stile = (tile, config) => new Schematic.Stile(tile.block(),
	tile.x, tile.y, config, 0);
core.reset = () => {
  core.code = 0;
  core.DispX = [];
	core.DispY = [];
  core.usedMass = [];
};
core.build = () => {
	const d = new BaseDialog("$settings");
	core.settings = d;

	const displays = Vars.content.blocks().select(block => block instanceof LogicDisplay);
	d.cont.pane(t => {
		t.defaults().growX().center();

		const icon = new TextureRegionDrawable(core.display.uiIcon);
		t.button("Display", icon, () => {
			ui.select("Select Display", displays, d => {
				core.display = d;
				core.size = d.displaySize;
				icon.region = d.uiIcon;
			}, i => displays.get(i).localizedName);
		}).height(120).row();
		
		
		
		
		const speed = new Table();
		speed.add("Speed: ").right();
		speed.field(core.speed, str => {
			core.speed = parseInt(str);
		}).growX().left().get().validator = str => !isNaN(parseInt(str));
		t.add(speed).height(64).row();
		
		const offset = new Table();
		offset.add("Debug offset: ").right();
		offset.field(core.offset, str => {
			core.offset = parseInt(str);
		}).growX().left().get().validator = str => !isNaN(parseInt(str));
		t.add(offset).height(64).row();
		
		
		const xDisplays = new Table();
		xDisplays.add("Disp count(x): ").right();
		xDisplays.field(core.xDisplays, str => {
			core.xDisplays = parseInt(str);
		}).growX().left().get().validator = str => !isNaN(parseInt(str));
		t.add(xDisplays).height(64).row();
		
		const yDisplays = new Table();
		yDisplays.add("Disp count(y): ").right();
		yDisplays.field(core.xDisplays, str => {
			core.yDisplays = parseInt(str);
		}).growX().left().get().validator = str => !isNaN(parseInt(str));
		t.add(yDisplays).height(64).row();

		// If false, transparency is simple channrl multiplication vs blending over displsy colour
		t.check("Gray Transparency", core.useGray, b => {core.useGray = b})
			.growX().center().row();

		const quality = new Table();
		quality.add("Quality:").center().row();
		quality.defaults().growX().center();

		let slider;
		const field = quality.field("" + core.quality, t => {
			const n = parseInt(t);
			core.quality = "" + n;
			slider.value = n;
		}).get();
		field.validator = t => !isNaN(parseInt(t));

		quality.row();
		slider = quality.slider(0, 255, 1, core.quality, n => {
			core.quality = n;
			field.text = "" + n;
		}).get();

		quality.row();
		quality.check("Use HSV", core.hsv, b => {core.hsv = b})
			.disabled(() => core.quality == 255);
		t.add(quality).height(160);
		
	}).growY().width(400);

	d.addCloseButton();
};
function pixmapOutline(pixmap){
  //pixmap = Pixmaps.scale(pixmap,(pixmap.width+16)/pixmap.width,(pixmap.height+16)/pixmap.height)
  
  let pxRegion = PixmapRegion(pixmap);
  return Pixmaps.outline(pxRegion, Color.black, 8);
};
function pixmapHang(pixmap){
  let size = core.size;
  let size2 = (size+16)/size;
  pixmap = Pixmaps.scale(pixmap,size2,size2);
  return Pixmaps.crop(pixmap,8,8,size+8,size+8);
}
function pixmapCrop(pixmap){
  let pixmaps = [];
  let width = pixmap.width;
  let height = pixmap.height;
  let x = 0, y = 0;
  let size = core.size;
  for (let Xd = 0; Xd < core.xDisplays; Xd++){
    for (let Yd = 0; Yd < core.yDisplays; Yd++){
      pixmaps.push(pixmapHang(Pixmaps.crop(pixmap,(size*Xd),(size*Yd),size+(size*Xd),size+(size*Yd))));
    }
  }
  return pixmaps;
};
function pixmapResize(pixmap) {
  let pixmaps = [];
  let maxx,maxy;
  maxx = core.size * core.xDisplays;
  maxy = core.size * core.yDisplays;
  
  if (pixmap.width != maxx || pixmap.height != maxy) {
    core.stage = "Scaling...";
		pixmap = Pixmaps.scale(pixmap,
			maxx / pixmap.width, maxy / pixmap.height);
	}
	pixmaps = pixmapCrop(pixmap);
	return pixmaps;
};
function BuildCode(out)
{
  const code = [];
	let current = [];
	let drawCalls = 0;
	let curColour;
	const check = () => 
	{
		let ret = true;
		if ((current.length + 3) >= core.speed) 
		{
			current.push("getlink lnk 0");
		    current.push("drawflush lnk");  
			//current.push("drawflush display1"); 
			code.push(current.join("\n"));
			current = [curColour];
			drawCalls = 1;
			ret = false;
		}

		if (++drawCalls >= LExecutor.maxGraphicsBuffer-1) 
		{
			current.push("getlink lnk 0");
			current.push("drawflush lnk");  
			//current.push("drawflush display1"); 
			current.push(curColour);
			drawCalls = 1;
			ret = false;
		}

		return ret;
	};
  for (let colour in out) {
		curColour = colour;
		if (check()) current.push(colour);
		for (let rect of out[colour]) 
		{
			check();
			// 0, 0 is the top left of a PNG and bottom left of a display, flip y
			current.push("draw rect " + [rect.x, core.size - rect.y - rect.h, rect.w, rect.h].join(" "));
		}
	}

	if (current.length > 0) {
		
		current.push("getlink lnk 0");
		current.push("drawflush lnk");  
		//current.push("drawflush display1"); 
		code.push(current.join("\n"));
	}
	return code;
};
function AddVoidValue(x,y)
{
  //let usedMass = [];
  core.DispX.push(x);
  core.DispY.push(y);
  let qe = 1,wr; // qe - minus // wr - plus //
  // -1 +3 
  if (core.display.size > 3){
    qe = 2;
    wr = 3;
  } else {
    wr = qe = 1;
  }
  for (let xs = x-qe; xs <= x+wr; xs++){
    for (let ys = y-qe; ys <= y+wr; ys++){
      core.usedMass.push([xs,ys])
    }
  }
  //core.usedMass.push.apply(core.usedMass,usedMass);
};
function AddDisplays()
{ 
 
  //let xmax = core.xDisplays * 3;
  //let ymax = core.yDisplays * 3;
  //let dispMap = [xmax,ymax] 
  // 4 on x 
  // 1 on y 
  let y = core.offset + 1 + Math.floor(core.display.size/2); 
  let x = core.offset + 1 + Math.floor(core.display.size/2); 
  //const disp = new Tile(x,y, Blocks.stone, Blocks.air, core.display); 
  
  //let tiles = Seq.with(stile(disp, null));
  //let tiles = Seq; 
  let tiles = new Seq();
  for (let iX = 0; iX < core.xDisplays; iX++)
  { 
    for (let iY = 0; iY < core.yDisplays; iY++)
	{ 
      let disp = new Tile(x, y, Blocks.stone, Blocks.air, core.display); 
      tiles.add(stile(disp,null)); 
      AddVoidValue(x,y); 
      y += core.display.size; 
    } 
    y = core.offset + 1+Math.floor(core.display.size/2);
    x += core.display.size ; 
} 
//throw new Error(""+tiles.size);
return tiles; 
};

function setTiles(cords) // Выдаёт массив с областью для процессоров
{
	// cords  -  display coordinates (x,y)
	let x = cords[0], y = cords[1];
	let offset = core.offset;
	let array = [],usedMass = core.usedMass;
	// left and right
	y += offset
	for (let i = 1; i < offset; i++) // offset = 6, i_max = 4
	{
		let min = x - 1 * i, max = x + 1 * i
		if (min < 0) { min = 0; }
		for (let newx = min; newx <= max; newx++)
		{
			if (InArray(usedMass,[newx,y]))
			{
				continue;
			}
			if (InArray(array,[newx,y]))
			{
				NetClient.sendMessage(""+"Найдено совпадение, там где не надо")
				continue;
			}
			array.push([newx,y]) // release
			//array.push(""+"("+[newx,y]+")") // debug
		}
		y--;
		
	}
	for (let i = offset; i < offset + 3; i++)
	{
		let min = x - 1 * offset, max = x + 1 * offset
		if (min < 0) { min = 0; }
		for (let newx = min; newx <= max; newx++)
		{
			if (InArray(usedMass,[newx,y]))
			{
				continue;
			}
			if (InArray(array,[newx,y]))
			{
				NetClient.sendMessage(""+"Найдено совпадение, там где не надо")
				continue;
			}
			array.push([newx,y]) // release
			//array.push(""+"("+[newx,y]+")") // debug
		}
		y--;
	}
	y = y - offset + 2;
	for (let i = 1; i < offset; i++) // offset = 6, i_max = 4
	{
		let min = x - 1 * i, max = x + 1 * i
		if (min < 0) { min = 0; }
		for (let newx = min; newx <= max; newx++)
		{
			if (InArray(usedMass,[newx,y]) || y < 0)
			{
				continue;
			}
			if (InArray(array,[newx,y]))
			{
				NetClient.sendMessage(""+"Найдено совпадение, там где не надо")
				continue;
			}
			array.push([newx,y]) // release
			//array.push(""+"("+[newx,y]+")") // debug
		}
		y++;

		
	}
	NetClient.sendMessage(""+usedMass)
	//NetClient.sendMessage(""+array)
	//NetClient.sendMessage(""+array.lenght)
  /*
  
  */

	return array;
  //obj.code = array;
 };
function ReverseArray(array){

  array.reverse();

  return array;
};
function InArray(array,coords,mode = 0){
  let x = coords[0],
  y = coords[1],
  i;
  for (let ind = 0; ind < array.length; ind++){
    i = array[ind];
    if (x == i[0] && y == i[1]){
		if (mode == 1){
			return ind;
		}
		return true;
    }
  }
  if (mode == 1){
	return -1;
  }
  return false;
};
function InArray2(array,int,mode=0){
  let num = int;
  let exceptions = cst.exceptionIND;
  for (let ind = 0; ind < array.length; ind++){
    if (num == array[ind] && !exceptions.includes(ind)){
		if (mode == 1){
			return ind;
		}
    return true;
    }
  }
  if (mode == 1){
	return -1;
  }
  return false;
};
function setProcedure(display,code,used){ // конкретно его код, больше ничей
	let x = display[0], y = display[1]
	// x3
	
}
function SetProcessors(codeMass){ // codeMass - массив codov процессоров для каждого дисплея
	let used = core.usedMass;
	let code = core.code
	let sorted = ReverseArray(code.sort(function (a, b) {
		return a - b;
	}));
	let displays = core.DispX.map(function(e, i) {
		return [e, core.DispY[i]];
	});
	let display = [], processors = [], ind = -1; 
	for (let i = 0; i < sorted.lenght; i++){
		ind = InArray2(code,sorted[i],1);
		display = displays[ind];
		processors = codeMass[ind]; 
	}
	
	for (let i = 0; i < displays.lenght; i++){
		

	}

}
core.export = pixmap => 
{
	// Only resize if it's not perfect (uses linear filtering, for cubic use gimp, imagemagick or something)
	core.DispX = [];
	core.DispY = [];
	core.usedMass = [];
  //pixmap = pixmapOutline(pixmap);
	let pixmaps = pixmapResize(pixmap);
	const dispcoordsX = [];
	const dispcoordsY = [];
	core.stage = "Adding displays...";
	const tiles = AddDisplays();
	//setTiles([8,8])
	//throw new Error(""+tiles.size);
	core.DispY = ReverseArray(core.DispY);
	let width = (2+core.offset)*2 +(core.xDisplays * core.display.size), height = (2+core.offset)*2 + (core.yDisplays * core.display.size);
	
	let ind;
	core.stage = "Building code...";
	let codeMass = [];
	for (let ins = 0; ins < pixmaps.length; ins++)
	{
		pixmap = pixmaps[ins];
		let out = fast(core, pixmap);
		let code = BuildCode(out);
		ind = ins + 1;
		core.stage = "Building processors for displays..."+ind+" of "+pixmaps.length;
		codeMass.push(code)
		//throw new Error(""+tiles.size);
		core.code += code.length;
		//
	}
	tiles.add(SetProcessors(codeMass));
	core.stage = "Saving...";
	// Create a schematic
	//AddSchematic(tiles,width,height)
	NetClient.sendMessage(""+core.code)
	core.tiles = tiles;
	//writeFileArr(tiles.toArray())
	core.stage = "";
	core.reset();
	
};
function AddSchematic(tiles,width,height)
{
	const tags = new StringMap(tiles);
	tags.put("name",core.name);
	const schem = new Schematic(tiles, tags, width, height);
	//Vars.schematics.getBuffer(schem);
	if (core.name != ""){
	  Vars.schematics.add(schem);
	}
	// Select it
	Vars.ui.schematics.hide();
	Vars.control.input.useSchematic(schem);
};
module.exports = core;
