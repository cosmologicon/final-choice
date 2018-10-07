"use strict"

UFX.scenes.climax = {
	start: function () {
		state.init()
		state.stage = "climax"
		state.tinvulnerable = 0
		state.you = new You({ x: -200, y: 50 })
		state.yous.push(state.you)
		state.yous.push(new Him({}))
		audio.tochoose()
		audio.playvoiceover("climax")
		this.twin = 0
		this.popped = false
		state.saved.J = true
		state.met.J = true
		state.met.C = true
		state.met[7] = true
	},
	think: function (dt) {
		let kstate = UFX.key.state()
		if (DEBUG && kstate.pressed.F1) dt *= 20
//		if (kstate.down.quit) UFX.scene.push("pause")
		if (kstate.down.swap) settings.swapaction = !settings.swapaction
		if (state.you.alive) {
			let dx = (kstate.pressed.right ? 1 : 0) - (kstate.pressed.left ? 1 : 0)
			let dy = (kstate.pressed.down ? 1 : 0) - (kstate.pressed.up ? 1 : 0)
			if (settings.portrait) [dx, dy] = [-dy, dx]
			if (dx && dy) {
				dx *= Math.SQRT1_2
				dy *= Math.SQRT1_2
			}
			state.you.move(dt, dx, dy)
			dx = state.you.x - 300
			dy = state.you.y
			if (!state.miracle) {
				let d = Math.hypot(dx, dy)
				;[dx, dy] = Math.norm([dx, dy], state.speed * 0.5 / (1 + Math.pow(d / 1000, 2)))
				state.you.x += dx * dt
				state.you.y += dy * dt
			}
			state.rocks.forEach(obj => {
				if (collided(obj, state.you)) obj.hit(state.you)
			})
		} else {
			state.you.x = 300
			state.you.y = 0
		}
		state.hp = 100
		state.sety0()
		audio.think(dt)
		if (state.you.alive && voplayer.done()) {
			this.twin += dt
			state.you.x += this.twin * 1000 * dt
			if (state.you.x > 1000 && !this.popped) {
				this.popped = true
				UFX.scene.swap("win")
			}
		} else {
			state.yous.concat(state.rocks).forEach(x => x.think(dt))
		}
		if (state.you.alive) {
			if (Math.hypot(state.you.x - 300, state.you.y) < 20) {
				voplayer.stop()
				audio.playline("C10")
				audio.playsfx("you-die")
				state.you.alive = false
				state.you.x = 300
				state.you.y = 0
			}
		} else {
			this.twin += dt
			if (this.twin > 5 && !this.popped) {
				this.popped = true
				state.saved.C = true
				UFX.scene.swap("win")
			}
		}
		let nrock = state.miracle ? 5 : 15
		while (UFX.random.flip(nrock * dt)) this.spawnrock()
	},
	spawnrock: function () {
		state.rocks.push(new Rock({
			x: 600,
			y: UFX.random(-state.yrange, state.yrange),
			vx: UFX.random(-500, -300),
			vy: UFX.random(-200, 200),
			r: UFX.random(20, 40),
			color0: [UFX.random(0.9, 1), UFX.random(0.7, 0.8), 0.6],
		}))
	},
	draw: function () {
		draw.clear()
		draw.nebula([1, 0.7, 0.4], [0, 0.5, 1], -100)
		draw.starfly(-100)
		draw.rocks(state.rocks.map(rock => rock.rockdata()))
		let sprites = state.yous
		draw.sprites(sprites.map(sprite => sprite.spritedata()))
		draw.rift()
		let a = Math.clamp(10 - state.you.t, 0, 1)
		if (a) draw.fill([0, 0, 0, a])
		voplayer.draw()
		let d = Math.hypot(state.you.x - 300, state.you.y)
		a = Math.clamp(255 - d, 0, 255) / 255
		if (!state.you.alive) a = 1
		draw.fill([1, 1, 1, a])
	},
}


UFX.scenes.win = {
	start: function () {
		this.dname = state.best() ? "E" : state.good() ? "D" : "B"
		this.title = state.best() ? "Best ending" : state.good() ? "Good ending" : "Bad ending"
		this.t = 0
		this.played = false
		audio.tochoose()
		checkpoint = null
		progress.beaten = true
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
	stop: function () {
		if (state.best()) audio.startgamemusic(0)
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

