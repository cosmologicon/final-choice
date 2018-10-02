"use strict"

// TODO: quicksaves

UFX.scenes.play = {
	start: function () {
		state.init()
		state.you = new You({ x: -300, y: 0 })
		state.yous.push(state.you)
		this.makewaves()
		audio.tofly()

//		state.planets.push(new Capsule({ name: "1", x: 0, y: 0, vx: -20, vy: 0, }))
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
			state.waves = [
				[0, "addheronsplash", 2, 2],
//				[0, "addemu"],
			]
		} else {
			state.waves = [[0, "addemu"]]
		}
	},
	think: function (dt) {
		// sound.mplay(2)
		let kstate = UFX.key.state()
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
			console.log(kstate.pressed.action, settings.swapaction)
			if (!!kstate.pressed.action == !!settings.swapaction) {
				state.you.act()
			}
		}
		// view.think(dt)
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

