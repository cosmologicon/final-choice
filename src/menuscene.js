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
