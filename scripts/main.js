const ui = require("ui_lib/library");

const core = require("pictologic/core");

var ptl;

ui.addMenuButton("PicToLogic", "paste", () => {
	ptl.show();
});

function writeFileArr(array){
  //DataOutputStream stream = new DataOutputStream(os);
  //Events.fire(new SaveWriteEvent());
  //stream.writeUTF("gaga")
  Fi.get("/storage/emulated/0/mods/tmp.txt").writePng(core.image)
  
  
}
ui.onLoad(() => {
	// Add button in Schematics dialog
	Vars.ui.schematics.buttons.button("PicToLogic", Icon.paste, () => {
		ptl.show();
	});

	ptl = new BaseDialog("PicToLogic");

	ptl.cont.add("[coral]1.[] Select a PNG image.");
	ptl.cont.row();
	ptl.cont.add("[coral]2.[] Click [stat]Export[] to create a schematic.");
	ptl.cont.row();
	ptl.cont.add("[coral]Please dont use this for furry/weeb shit thank you");
	ptl.cont.row();
	ptl.cont.pane(t=> {
	  t.defaults().growX().center();
	  const name = new Table();
		name.add("Name: ").right();
		name.field(core.name, str => {
			core.name = str;
		}).growX().left().get();
		t.add(name).height(64).row();
		
	}).height(64).width(400);
	ptl.cont.row();
	ptl.cont.button("Select Image", () => {
		Vars.platform.showFileChooser(false, "png", file => {
			try {
				const bytes = file.readBytes();
				core.image = new Pixmap(bytes);
			} catch (e) {
				ui.showError("Failed to load source image", e);
			}
		});
	}).size(240, 50);
	ptl.cont.row();

	ptl.cont.label(() => core.stage).center();

	ptl.addCloseButton();
	ptl.buttons.button("$settings", Icon.settings, () => {
		core.settings.show();
	});
	/*
	ptl.buttons.button("Debug", Icon.settings, () => {
	    
	});
	*/
	ptl.buttons.button("Export", Icon.export, () => {
		new java.lang.Thread(() => {
			try {
				core.export(core.image);
				ptl.hide();
			} catch (e) {
				Core.app.post(() => {
					ui.showError("Failed to export schematic", e);
					core.stage = "";
				});
			}
		}, "PicToLogic worker").start();
	}).disabled(() => !core.image || core.stage != "");

	core.build();
});
