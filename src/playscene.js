"use strict"

// TODO: quicksaves

UFX.scenes.play = {
	start: function () {
		state.clear()
		state.restart()
//		state.stage = stage
		state.you = new You({ x: -300, y: 0 })
		state.yous.push(state.you)
//		makewaves()
	},
	think: function (dt) {
		// sound.mplay(2)
		let kstate = UFX.key.state()
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
			if (kstate.pressed.action != settings.swapaction) {
				state.you.act()
			}
		}
		// view.think(dt)
		state.think(dt)
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
		if (state.tlose) {
			let alpha = Math.clamp(state.tlose - 2, 0, 1)
			draw.fill([0, 0, 0, alpha])
		} else if (state.twin > 2) {
			let alpha = Math.clamp(state.twin - 2, 0, 1)
			draw.fill([0.8, 0.8, 1, alpha])
		}
	},
}

