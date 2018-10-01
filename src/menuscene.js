"use strict"

UFX.scenes.menu = {
	start: function () {
		UFX.resource.onloading = this.onloading.bind(this)
		UFX.resource.onload = this.onload.bind(this)
		this.f = 0
		this.opt = "Settings"
		this.opts = ["Settings", "Progress", "License"]
		this.moved = false
	},
	onloading: function (f, obj, objtype) {
		this.f = f
		if (objtype == "fonts") gl.progs.text.clear()
	},
	onload: function () {
		this.makeopts()
		if (!this.moved) this.opt = this.opts[0]
		audio.startgamemusic(0)
	},
	makeopts: function () {
		this.opts = ["Play Easy", "Play Hard", "Settings", "Progress", "License"]
	},
	resume: function () {
		this.makeopts()
	},
	think: function (dt) {
		let kstate = UFX.key.state()
		if (kstate.down.down || kstate.down.right) {
			this.opt = lnext(this.opts, this.opt)
			this.moved = true
		}
		if (kstate.down.up || kstate.down.left) {
			this.opt = lprev(this.opts, this.opt)
			this.moved = true
		}
		if (kstate.down.action) {
			this.select()
			this.moved = true
		}
	},
	select: function () {
		switch (this.opt) {
			case "Settings": UFX.scene.push("settings") ; break
			case "Progress": UFX.scene.push("progress") ; break
			case "License":
				window.open("license", "_blank")
				break
		}
	},
	drawline: function (text, h, fontsize, color) {
		let pos = [draw.wV / 2, draw.hV / 2 + T(h)]
		gl.progs.text.draw(text, {
			midbottom: pos, color: color, fontname: "Bungee", fontsize: T(fontsize),
			ocolor: "black", width: T(440),
		})
	},
	draw: function () {
		draw.startalk()
		
		gl.progs.text.use()
		this.drawline("The Final Choice", 160, 40, "white")
		this.drawline("by Team Universe Factory", 124, 28, "yellow")
		this.opts.forEach((opt, jopt) => {
			let text = opt == this.opt ? "\u2022 " + opt + " \u2022" : opt
			let color = opt == this.opt ? "white" : "#AAA"
			this.drawline(text, 60 - 40 * jopt, 32, color)
		})
		if (this.f < 1) {
			this.drawline("Loading... " + (100 * this.f).toFixed(0) + "%", -120, 24, "gray")
		}
		if (this.opt == "Play Easy") {
			let text = "In Easy mode, crew members you've rescued on previous playthroughs will be automatically rescued."
			this.drawline(text, -210, 16, "gray")
		}
		if (this.opt == "Play Hard") {
			let text = "In Hard mode, you must rescue all crew members in a single playthrough for the Good Ending."
			this.drawline(text, -210, 16, "gray")
		}
	},
}

UFX.scenes.settings = {
	start: function () {
		this.opt = "Done"
		this.opts = ["Layout", "Fullscreen", "Sound volume", "Music volume", "Voice volume", "Done"]
	},
	think: function (dt) {
		let kstate = UFX.key.state()
		if (kstate.down.down) {
			this.opt = lnext(this.opts, this.opt)
		}
		if (kstate.down.up) {
			this.opt = lprev(this.opts, this.opt)
		}
		if (kstate.down.left) this.advance(-1)
		if (kstate.down.right) this.advance(1)
		if (kstate.down.action) this.advance(1, true)
	},
	advance: function (dvalue, loop) {
		let levels = [0, 0.2, 0.4, 0.6, 0.8, 1]
		function alevel(level) {
			if (dvalue == 1 && loop && level == 1) return 0
			if (dvalue == -1 && loop && level == 0) return 1
			return dvalue == 1 ? lnext(levels, level) : lprev(levels, level)
		}
		switch (this.opt) {
			case "Layout":
				settings.portrait = !settings.portrait
				draw.setaspect()
				break
			case "Fullscreen":
				settings.fullscreen = !settings.fullscreen
				// TODO
				break
			case "Sound volume":
				settings.sfxvolume = alevel(settings.sfxvolume)
				audio.setsfxvolume(settings.sfxvolume)
				break
			case "Music volume":
				settings.musicvolume = alevel(settings.musicvolume)
				audio.setmusicvolume(settings.musicvolume)
				break
			case "Voice volume":
				settings.dialogvolume = alevel(settings.dialogvolume)
				audio.setdialogvolume(settings.dialogvolume)
				break
			case "Done":
				UFX.scene.pop()
				break
		}
	},
	getsetting: function (opt) {
		switch (opt) {
			case "Layout": return settings.portrait ? "Vertical" : "Horizontal"
			case "Fullscreen": return settings.fullscreen ? "ON" : "OFF"
			case "Sound volume": return (settings.sfxvolume * 100).toFixed() + "%"
			case "Music volume": return (settings.musicvolume * 100).toFixed() + "%"
			case "Voice volume": return (settings.dialogvolume * 100).toFixed() + "%"
		}
	},
	draw: function () {
		draw.startalk()
		
		gl.progs.text.use()
		this.opts.forEach((opt, jopt) => {
			let text = opt
			if (text != "Done") text += ": " + this.getsetting(opt)
			if (opt == this.opt) text = "\u2022 " + text + " \u2022"
			let color = opt == this.opt ? "white" : "#AAA"
			UFX.scenes.menu.drawline(text, 60 - 40 * jopt, 32, color)
		})
	},

}
