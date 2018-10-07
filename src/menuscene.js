"use strict"

UFX.scenes.menu = {
	start: function () {
		UFX.resource.onloading = this.onloading.bind(this)
		UFX.resource.onload = this.onload.bind(this)
		this.f = 0
		this.opt = "Settings"
		this.opts0 = progress.beaten ? ["Settings", "Progress", "License"] : ["Settings", "License"]
		this.makeopts()
		this.okopts = this.opts0
		this.moved = false
		this.loaded = false
		
		document.addEventListener("visibilitychange", () => {
			if (document.hidden && UFX.scene.top() !== UFX.scenes.blur) {
				UFX.scene.top().draw()
				UFX.scene.ipush("blur")
			}
		}, false);
	},
	onloading: function (f, obj, objtype) {
		this.f = f
		if (objtype == "fonts") gl.progs.text.clear()
	},
	onload: function () {
		draw.init()
		this.okopts = this.opts
		// if (!this.moved) this.opt = this.opts[0]
		audio.startgamemusic(0)
		this.loaded = true
	},
	makeopts: function () {
		if (!progress.beaten && checkpoint === null) {
			this.opts = ["Play"]
		} else if (!progress.beaten && checkpoint !== null) {
			this.opts = ["Continue", "Restart"]
		} else if (progress.beaten && checkpoint === null) {
			this.opts = ["Play Easy", "Play Hard"]
		} else if (progress.beaten && checkpoint !== null) {
			this.opts = ["Continue", "Restart Easy", "Restart Hard"]
		}
		this.opts = this.opts.concat(this.opts0)
	},
	resume: function () {
		console.log("resuming")
		if (this.loaded) audio.tochoose(0)
		this.makeopts()
		//this.opt = this.opts[0]
	},
	think: function (dt) {
		let kstate = UFX.key.state()
		if (kstate.down.down || kstate.down.right) {
			this.opt = lnext(this.okopts, this.opt)
			this.moved = true
		}
		if (kstate.down.up || kstate.down.left) {
			this.opt = lprev(this.okopts, this.opt)
			this.moved = true
		}
		if (kstate.down.action) {
			this.select()
			this.moved = true
		}
	},
	select: function () {
		switch (this.opt) {
			case "Continue":
				state.continuegame()
				UFX.scene.push("play")
				break
			case "Play": case "Play Easy": case "Restart": case "Restart Easy":
				state.miracle = true
				state.startgame()
				UFX.scene.push("play")
				break
			case "Play Hard": case "Restart Hard":
				state.miracle = false
				state.startgame()
				UFX.scene.push("play")
				break
			case "Settings": UFX.scene.push("settings") ; break
			case "Progress": UFX.scene.push("progress") ; break
			case "License":
				window.open("license", "_blank")
				break
		}
	},
	drawline: function (text, h, fontsize, color, p0) {
		p0 = p0 || [0.5, 0.5]
		let pos = [draw.wV * p0[0], draw.hV * p0[1] + T(h)]
		gl.progs.text.draw(text, {
			midbottom: pos, color: color, fontname: "Bungee", fontsize: T(fontsize),
			ocolor: "black", width: T(440),
		})
	},
	draw: function () {
		draw.clear()
		draw.startalk()
		gl.progs.text.use()
		this.drawline("The Final Choice", 160, 40, "white")
		this.drawline("by Team Universe Factory", 124, 25, "yellow")
		this.opts.forEach((opt, jopt) => {
			let text = opt
			if (text == "Continue") text += " [Stage " + (checkpoint ? checkpoint.stage : "???") + "]"
			text = opt == this.opt ? "\u2022 " + text + " \u2022" : text
			let color = opt == this.opt ? "white" : this.okopts.includes(opt) ? "#AAA" : "#222"
			this.drawline(text, 60 - 40 * jopt, 32, color)
		})
		if (this.f < 1) {
			this.drawline("Loading... " + (100 * this.f).toFixed(0) + "%", -120, 24, "gray")
		}
		if (this.opt == "Play Easy" || this.opt == "Restart Easy") {
			let text = "In Easy mode, crew members you've rescued on previous playthroughs will be automatically rescued."
			this.drawline(text, -210, 16, "gray")
		}
		if (this.opt == "Play Hard" || this.opt == "Restart Hard") {
			let text = "In Hard mode, you must rescue all crew members in a single playthrough for the Good Ending."
			this.drawline(text, -210, 16, "gray")
		}
	},
}

UFX.scenes.settings = {
	start: function () {
		this.opt = "Done"
		this.opts = ["Layout", "Fullscreen", "Auto-fire", "Sound volume", "Music volume", "Voice volume", "Silence all", "Done"]
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
				UFX.scene.push("gofull")
				break
			case "Auto-fire":
				settings.swapaction = !settings.swapaction
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
			case "Silence all":
				settings.sfxvolume = 0
				audio.setsfxvolume(settings.sfxvolume)
				settings.musicvolume = 0
				audio.setmusicvolume(settings.musicvolume)
				settings.dialogvolume = 0
				audio.setdialogvolume(settings.dialogvolume)
				break
			case "Done":
				UFX.scene.pop()
				break
		}
		save.save()
	},
	getsetting: function (opt) {
		switch (opt) {
			case "Layout": return settings.portrait ? "Vertical" : "Horizontal"
			case "Fullscreen": return settings.fullscreen ? "ON" : "OFF"
			case "Auto-fire": return settings.swapaction ? "OFF" : "ON"
			case "Sound volume": return (settings.sfxvolume * 100).toFixed() + "%"
			case "Music volume": return (settings.musicvolume * 100).toFixed() + "%"
			case "Voice volume": return (settings.dialogvolume * 100).toFixed() + "%"
		}
	},
	draw: function () {
		draw.clear()
		draw.startalk()
		
		gl.progs.text.use()
		this.opts.forEach((opt, jopt) => {
			let text = opt
			if (text != "Done" && text != "Silence all") text += ": " + this.getsetting(opt)
			if (opt == this.opt) text = "\u2022 " + text + " \u2022"
			let color = opt == this.opt ? "white" : "#AAA"
			UFX.scenes.menu.drawline(text, 160 - 40 * jopt, 32, color)
		})
	},
}

UFX.scenes.progress = {
	start: function () {
		this.t = 0
		this.opt = "Back"
		this.opts = ["Reset progress", "Back"]
	},
	think: function (dt) {
		this.t += dt
		let kstate = UFX.key.state()
		if (kstate.down.down || kstate.down.right) {
			this.opt = lnext(this.opts, this.opt)
		}
		if (kstate.down.up || kstate.down.left) {
			this.opt = lprev(this.opts, this.opt)
		}
		if (kstate.down.action) this.select()
	},
	select: function () {
		switch (this.opt) {
			case "Reset progress":
				resetprogress()
				break
			case "Back":
				UFX.scene.pop()
				break
		}
	},
	draw: function () {
		draw.clear()
		draw.startalk()
		gl.progs.text.use()
		let text = "Hawking crew members who have been rescued on previous complete playthroughs. When playing the game on Easy mode, these crew members will not need to be rescued again."
		gl.progs.text.draw(text, {
			midbottom: yswap(settings.portrait ? T(240, 280) : T(427, 140)),
			fontname: "Bungee", fontsize: T(22), color: "#BFF",
			width: T(settings.portrait ? 400 : 700),
		})
		;"123456X".split("").forEach((name, j) => {
			let dx = 320/3 * (j % 4) + 320/6 * (j >= 4), dy = 100 * Math.floor(j / 4)
			let pos = yswap(settings.portrait ? T(76 + dx, 400 + dy) : T(264 + dx, 220 + dy))
			let a = Math.clamp((this.t - 2) * 2, 0, (progress.met[name] ? 1 : 0.99))
			if (a) draw.avatar(name, pos, T(60), a, true)
			let alpha = Math.clamp((this.t - 3) * 2, 0, 1)
			if (alpha == 0) {
			} else if (!progress.met[name]) {
				gl.progs.text.use()
				gl.progs.text.draw(" ? ", { center: pos, fontsize: T(50), fontname: "Permanent Marker",
					color: "red", ocolor: "black", alpha: alpha, })
			} else if (!progress.saved[name]) {
				gl.progs.text.use()
				gl.progs.text.draw(" X ", { center: pos, fontsize: T(50), fontname: "Permanent Marker",
					color: "red", ocolor: "black", alpha: alpha, })
			}
		})
		gl.progs.text.use()
		this.opts.forEach((opt, jopt) => {
			let text = opt
			if (opt == this.opt) text = "\u2022 " + text + " \u2022"
			let color = opt == this.opt ? "white" : "#AAA"
			UFX.scenes.menu.drawline(text, -170 - 40 * jopt, 32, color)
		})
	},
}


UFX.scenes.pause = {
	start: function (extrapop) {
		audio.suspend()
		this.opt = "Resume"
		this.opts = ["Settings", "Quit to Menu", "Resume"]
		this.topop = 2 + (extrapop || 0)
	},
	stop: function () {
		audio.resume()
	},
	think: function (dt) {
		let kstate = UFX.key.state()
		if (kstate.down.down || kstate.down.right) {
			this.opt = lnext(this.opts, this.opt)
		}
		if (kstate.down.up || kstate.down.left) {
			this.opt = lprev(this.opts, this.opt)
		}
		if (kstate.down.action) this.select()
	},
	select: function () {
		switch (this.opt) {
			case "Settings":
				UFX.scene.push("settings")
				break
			case "Quit to Menu":
				for (let j = 0 ; j < this.topop ; ++j) UFX.scene.pop()
				voplayer.stop()
				audio.stopdialog()
				break
			case "Resume":
				UFX.scene.pop()
				break
		}
	},
	draw: function () {
		draw.clear()
		draw.help()
		gl.progs.text.use()
		let p0 = settings.portrait ? [0.5, 0.7] : [0.8, 0.35]
		this.opts.forEach((opt, jopt) => {
			let text = opt
			if (opt == this.opt) text = "\u2022 " + text + " \u2022"
			let color = opt == this.opt ? "white" : "#AAA"
			UFX.scenes.menu.drawline(text, 60 - 40 * jopt, 32, color, p0)
		})
	},
}

UFX.scenes.blur = {
	start: function () {
		draw.fill([0.2, 0.2, 0.2, 0.8])
		this.audiostopped = audio.on
		if (this.audiostopped) audio.suspend()
		gl.progs.text.use()
		gl.progs.text.draw("Press Space\nto resume", {
			center: [draw.wV/2, draw.hV/2],
			fontname: "Bungee", fontsize: T(50),
			color: "white", ocolor: "black", owidth: 6,
		})
	},
	think: function (dt) {
		let kstate = UFX.key.state()
		for (let d in kstate.down) {
			if (kstate.down[d]) {
				if (this.audiostopped) audio.resume()
				UFX.scene.pop()
			}
		}
	},
}
