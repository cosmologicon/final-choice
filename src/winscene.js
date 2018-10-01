"use strict"

UFX.scenes.win = {
	start: function () {
		this.dname = state.best() ? "E" : state.good() ? "D" : "B"
		this.title = state.best() ? "Best ending" : state.good() ? "Good ending" : "Bad ending"
		this.t = 0
		this.played = false
		audio.tochoose()
		checkpoint = null
		state.recordprogress()
	},
	think: function (dt) {
		let kstate = UFX.key.state()
		this.t += dt
		if (this.t > 2 && !this.played) {
			this.played = true
			audio.playvoiceover(this.dname)
		}
		if (this.played && voplayer.done() && kstate.down.action) {
			UFX.scene.pop()
			if (state.good()) UFX.scene.push("credits")
		}
		audio.think(dt)
	},
	draw: function () {
		draw.clear()
		draw.startalk()
		voplayer.draw()
		
		gl.progs.text.use()
		gl.progs.text.draw("Thank you for playing", {
			midbottom: yswap(settings.portrait ? T(240, 240) : T(427, 140)),
			fontname: "Bungee", fontsize: T(40), color: "#BFF",
			width: T(settings.portrait ? 400 : 700),
		})
		gl.progs.text.draw(this.title, {
			midtop: yswap(settings.portrait ? T(240, 260) : T(427, 160)),
			fontname: "Bungee", fontsize: T(32), color: "#6FF",
			width: T(settings.portrait ? 400 : 700),
		})
		;"123456X7CJ".split("").forEach((name, j) => {
			let dx = 80 * (j % 5), dy = 80 * Math.floor(j / 5)
			let pos = yswap(settings.portrait ? T(76 + dx, 400 + dy) : T(264 + dx, 260 + dy))
			let a = Math.clamp((this.t - 2) * 2, 0, (state.met[name] ? 1 : 0.99))
			if (a) draw.avatar(name, pos, T(60), a, true)
			let alpha = Math.clamp((this.t - 3) * 2, 0, 1)
			if (alpha == 0) {
			} else if (name == "7") {
			} else if (!state.met[name]) {
				gl.progs.text.use()
				gl.progs.text.draw(" ? ", { center: pos, fontsize: T(50), fontname: "Permanent Marker",
					color: "red", ocolor: "black", alpha: alpha, })
			} else if (!state.saved[name]) {
				gl.progs.text.use()
				gl.progs.text.draw(" X ", { center: pos, fontsize: T(50), fontname: "Permanent Marker",
					color: "red", ocolor: "black", alpha: alpha, })
			}
		})
	},
}


UFX.scenes.credits = {
	start: function () {
		this.t = 0
		if (state.best()) {
			audio.startendmusic()
		} else {
			audio.tochoose()
		}
	},
	think: function (dt) {
		this.t += dt
		if (this.t >= 45) UFX.scene.pop()
	},
	lines: [
		[2, "Team Lead", "Christopher Night"],
		[3, "Programming", "Christopher Night"],
		[8, "Game Concept", "Charles McPillan"],
		[9, "Story Lead", "Magnus Drebenstedt"],
		[14, "Music", "Mary Bichner"],
		[15, "Production", "Charles McPillan"],
		[20, "Voices", "Randy Parcel", "Jules Van Oosterom", "Adam Jones", "Mary Bichner", "Charles McPillan"],
		[21, "Graphics", "Christopher Night"],
		[26, "Character and\nBackground Art", "Many contributors\nat Pixabay"],
		[27, "Sound Effects", "Christopher Night"],
		[32, '"The Ballad of Captain Alyx"', "Music by Mary Bichner", "Lyrics by Christopher Night"],
		[38, "The Final Choice", "by Team Universe Factory", "for PyWeek 23"],
	],
	draw: function () {
		draw.clear()
		draw.startalk()
		gl.progs.text.use()
		this.lines.forEach((line, jline) => {
			let dj = jline >= this.lines.length - 2 ? 0.5 : jline % 2
			let dt = this.t - line[0]
			if (dt < 0 || dt > 6) return
			let alpha = Math.clamp(Math.min(1.5 * dt, 1.5 * (5 - dt)), 0, 1)
			let pos = yswap(settings.portrait ? T(240, 300 + 300 * dj) : T(240 + 400 * dj, 200 + 60 * dj))
			gl.progs.text.draw(line[1], {
				midbottom: pos, color: "#BFF", fontname: "Bungee", fontsize: T(26), alpha: alpha,
			})
			dt -= 0.1
			alpha = Math.clamp(Math.min(1.5 * dt, 1.5 * (5 - dt)), 0, 1)
			gl.progs.text.draw(line.slice(2).join("\n"), {
				midtop: pos, color: "#FFF", fontname: "Bungee", fontsize: T(26), alpha: alpha,
			})
		})
	},
}

