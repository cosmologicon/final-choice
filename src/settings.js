"use strict"

let settings = {
	portrait: true,
	fullscreen: false,
	swapaction: false,
	sfxvolume: 0.6,
	musicvolume: 0.6,
	dialogvolume: 0.6,
	easy: true,
}

UFX.key.remaparrows(true)
UFX.key.remap({
	space: "action", enter: "action", ctrl: "action", shift: "action", Z: "action",
	tab: "swap", caps: "swap",
	esc: "quit",
	// TODO: portrait, toggledebug, fullscreen
})
