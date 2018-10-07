"use strict"

// TODO: quicksaves

UFX.scenes.play = {
	start: function () {
		state.init()
		state.you = new You({ x: -300, y: 0 })
		state.yous.push(state.you)
		this.makewaves()
		audio.tofly()
		this.haspaused = state.stage != 1
	},
	makewaves: function () {
		if (state.stage == 1) {
			state.waves = [
				[3, "playvo", "intro"],
				[0, "addduckwave", 700, 500, 4, 4, [
					[0, 350, 100],
					[4, 200, -200],
					[8, 0, 100],
					[12, -600, 200],
				]],
				[0, "addduckwave", 700, -500, 4, 4, [
					[0, 350, -100],
					[4, 200, 200],
					[8, 0, -100],
					[12, -600, -200],
				]],
				[0, "addheronsplash", 2, 2],
				[20, "addemu"],
			]
		} else if (state.stage == 2) {
			state.waves = [
				[0, "addcapsule", 1, 0, 0, -20, 0],
				[40, "addcapsule", 2, 500, 100, -40, 0],
				[80, "addcapsule", 3, 500, 0, -40, 6],

				[0, "addheronsplash", 1, 4, 600],
				[10, "addheronsplash", 1, 4, 600],
				[30, "addturkeywave", 700, 0, 1, 8, [
					[0, 250, 0],
					[8, -700, 0],
				]],
				[30, "addturkeywave", 700, 0, 1, 8, [
					[0, 350, 0],
					[12, -700, 0],
				]],
				[30, "addturkeywave", 700, 0, 1, 8, [
					[0, 450, 0],
					[16, -700, 0],
				]],
				[30, "addlarkwave", 10, 200, 0, -100, 500, 200],
				[40, "addlarkwave", 10, -100, 0, 100, -500, 200],

				[30, "addasteroids", 60, 1400],

				[60, "addclusterbombs", 20, 40, 0, 400, 600, 0, -60, -60],
				[64, "addclusterbombs", 20, 40, 0, -400, 600, 0, -60, 60],

				[96, "addlarkwave", 10, 200, 120, -100, 300, 200],
				[102, "addlarkwave", 10, 200, -120, 100, -300, 200],
				[100, "addlarkwave", 10, -100, 120, -100, 300, 200],
				[98, "addlarkwave", 10, -100, -120, 100, -300, 200],

				[100, "addegret"],
			]
		} else if (state.stage == 3) {
			state.waves = [
				[0, "addcapsule", 4, 520, 260, -40, 0],
				[45, "addcapsule", 5, 330, -400, -5, 40],
				[90, "addcapsule", 6, 500, 0, -100, -40],

				[5, "addduckwave", 700, 500, 4, 4, [
					[0, 350, 100],
					[4, 200, -200],
					[8, 0, 100],
					[12, -600, 200],
				]],
				[5, "addduckwave", 700, -500, 4, 4, [
					[0, 350, -100],
					[4, 200, 200],
					[8, 0, -100],
					[12, -600, -200],
				]],

				[0, "addheronsplash", 2, 4, 1000],
				[0, "addcobra", 20, 40, 500, 300, -450, -100, 0, 100],
				[5, "addcobra", 20, 40, 500, -300, -450, 100, 0, 100],
				[15, "addasteroids", 50, 1200, 123],
				[15, "addbluerock", 1200, 220, -40, 0],
				[35, "addcobra", 40, 80, 500, 0, -1400, 0, 0, 320],
				[35, "addcobra", 40, 80, 1000, 0, -1400, 0, -500, 320],

				[55, "addclusterbombs", 20, 40, 0, 400, 600, 0, -60, -60],
				[59, "addclusterbombs", 20, 40, 0, -400, 600, 0, -60, 60],

				[80, "addcobra", 20, 40, -400, 500, 0, -500, 0, 100],
				[83, "addcobra", 20, 40, -250, -500, 0, 500, 0, 100],
				[86, "addcobra", 20, 40, -100, 500, 0, -500, 0, 100],
				[89, "addcobra", 20, 40, 50, -500, 0, 500, 0, 100],
				[92, "addcobra", 20, 40, 200, 500, 0, -500, 0, 100],
				[95, "addcobra", 20, 40, 350, -500, 0, 500, 0, 100],
				[90, "addlarkwave", 10, 200, 0, -100, 500, 200],
				[90, "addlarkwave", 10, -100, 0, 100, -500, 200],

				[105, "addmedusa"],
			]
		} else if (state.stage == 4) {
			state.waves = [
				[0, "addgabriel"],
				[6, "playvo", "A"],
				[6, "addhawk"],
			]
		} else {
			state.waves = [[0, "addemu"]]
		}
	},
	think: function (dt) {
		// sound.mplay(2)
		let kstate = UFX.key.state()
		if (DEBUG && kstate.pressed.F1) {
			dt *= 20
			state.heal(1000)
		}
		if (kstate.down.quit) {
			UFX.scene.push("pause")
			this.haspaused = true
		}
		if (kstate.down.swap) settings.swapaction = !settings.swapaction
		if (kstate.down.aspect) {
			settings.portrait = !settings.portrait
			draw.setaspect()
			save.save()
		}
		if (state.you.alive) {
			let dx = (kstate.pressed.right ? 1 : 0) - (kstate.pressed.left ? 1 : 0)
			let dy = (kstate.pressed.down ? 1 : 0) - (kstate.pressed.up ? 1 : 0)
			if (settings.portrait) [dx, dy] = [-dy, dx]
			if (dx && dy) {
				dx *= Math.SQRT1_2
				dy *= Math.SQRT1_2
			}
			state.you.move(dt, dx, dy)
			if (!!kstate.pressed.action == !!settings.swapaction) {
				state.you.act()
			}
		}
		if (kstate.down.F2) state.heal(1000)
		if (kstate.down.F3) {
			state.cheat()
			voplayer.stop()
			audio.stopdialog()
		}
		state.think(dt)
		audio.think(dt)
	},
	draw: function () {
		draw.clear()
		if (!settings.lowres) {
			if (state.stage == 1) {
				draw.nebula([0.2, 0, 0], [0, 0.2, 0.2])
			} else if (state.stage == 2) {
				draw.nebula([0.1, 0, 0.1], [0.2, 0.1, 0])
			} else if (state.stage == 3) {
				draw.nebula([0, 0, 0], [0.2, 0.2, 0.2])
			} else {
				draw.nebula([0, 0, 0.3], [0, 0.2, 0.1])
			}
			draw.starfly()
		}
		state.draw()
		this.drawhud()
		voplayer.draw()
		if (state.tlose) {
			let alpha = Math.clamp(state.tlose - 2, 0, 1)
			draw.fill([0, 0, 0, alpha])
		} else if (state.twin > 2) {
			let alpha = Math.clamp(state.twin - 2, 0, 1)
			draw.fill([0.8, 0.8, 1, alpha])
		}
		if (DEBUG) {
			state.drawhitboxes()
			let text = [
				"F1: hyperspeed",
				"F2: heal",
				"F3: beat stage",
				"HP: " + state.hp + " " + state.shieldhp.toFixed(2),
				"tinvulnerable: " + state.tinvulnerable.toFixed(2),
				UFX.ticker.getrates(),
			].join("\n")
			gl.progs.text.use()
			gl.progs.text.draw(text, {
				bottomleft: [10, 10],
				fontname: "Bungee",
				fontsize: T(20),
				ocolor: "black",
			})
		}
		if (!this.haspaused) {
			let text = "Esc: pause/help/settings"
			gl.progs.text.use()
			gl.progs.text.draw(text, {
				topright: [draw.wV - 10, draw.hV - 10],
				fontname: "Bungee",
				fontsize: T(20),
				ocolor: "black",
			})
		}
	},
	drawhud: function () {
		let imgnames = []
		for (let jhp = 0 ; jhp < state.hp0 ; ++jhp) {
			imgnames.push(jhp < state.hp ? "health" : "health0")
		}
		for (let jhp = 0 ; jhp < state.shieldhp0 ; ++jhp) {
			let a = Math.clamp(state.shieldhp - jhp, 0, 1)
			imgnames.push(a == 1 || a * 20 % 2 > 1 ? "shield" : "health0")
		}
		draw.health(imgnames)
	},
}

