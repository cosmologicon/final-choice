"use strict"

// TODO: quicksaves

UFX.scenes.play = {
	start: function () {
		state.init()
		state.you = new You({ x: -300, y: 0 })
		state.yous.push(state.you)
		this.makewaves()
		audio.tofly()
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
		
		
		} else {
			state.waves = [[0, "addemu"]]
		}
	},
	think: function (dt) {
		// sound.mplay(2)
		let kstate = UFX.key.state()
		if (DEBUG && kstate.pressed.F1) dt *= 20
		if (kstate.down.quit) UFX.scene.push("pause")
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
			if (!!kstate.pressed.action == !!settings.swapaction) {
				state.you.act()
			}
		}
		if (kstate.down.F2) state.heal(1000)
		if (kstate.down.F3) state.cheat()
		state.think(dt)
		audio.think(dt)
	},
	draw: function () {
		if (settings.lowres) {
			draw.clear()
		} else {
			draw.nebula([0.2, 0, 0], [0, 0.2, 0.2])
			draw.starfly()
		}
		state.draw()
		// hud.draw()
		voplayer.draw()
		if (state.tlose) {
			let alpha = Math.clamp(state.tlose - 2, 0, 1)
			draw.fill([0, 0, 0, alpha])
		} else if (state.twin > 2) {
			let alpha = Math.clamp(state.twin - 2, 0, 1)
			draw.fill([0.8, 0.8, 1, alpha])
		}
	},
}

