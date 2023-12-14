const obj = {
  code: []
}
/*
function SetValidArea(x,y){
  let offset = core.offset;
  // Ставит Валидные координаты для создания процессоров
  let dispminX = x - offset;
  let dispmaxX = x + offset+1;
  let dispminY = y - offset;
  let dispmaxY = y + offset+1;
  let array = [], v,index = 0;
  let usedMass = core.usedMass;
  //throw new Error('' + dispminX + '_' + dispmaxX);
  for (let c = dispminX; c < dispmaxX; c++){
      v = dispminY + index;
      dispmaxX -= index;
      dispmaxY -= index;
      array.push.apply(array, setTiles(c,v,dispmaxX,dispmaxY);
      index++;
  }
  return array;
};


		let build = Blocks.microProcessor.newBuilding();
		build.tile = new Tile(x, y, Blocks.stone, Blocks.air, Blocks.microProcessor);
		// Link the display to the processor
		build.links.add(new LogicBlock.LogicLink(core.DispX[index],core.DispY[index], "display1", true));
		// Add the image segment code
		build.updateCode(code[i]);
		tiles.add(stile(build.tile, build.config()));
		*/

/*function SpawnProcessors(codes) 
{
	for (let i = 0; i < codes.length; i++)
	{

	}
}*/
function InArray(array,coords){

  var x = coords[0];

  var y = coords[1];
  for (var ind = 0; ind < array.length; ind++){
    var i = array[ind];
    if (x == i[0] && y == i[1]){
    return true;
    }
  }
  return false;
};
function setTiles(x,y,maxx,maxy){
  var c,v, array = obj.code;
  for (c = maxx-1; c > x-1; c--){
    v = y;
    if (InArray(array,[c,v]) || c < 0 || v < 0){
		    continue;
		}
    array.push([c,v]);
  }
  for (v = maxy-1; v>y-1;v--){
    c = x;
    if (InArray(array,[c,v]) || c < 0 || v < 0){
		    continue;
		}
    array.push([c,v]);
  }
  obj.code = array;
  return array;
}
var u = [[12,30],[32,48],[12,34]]
//var t = InArray(u, [12,35]);
for (var i = 0; i < 10;i++){
  for (var o = 0; o < 10;o++){
    console.log(""+setTiles(i,o,10,10))
}
}
