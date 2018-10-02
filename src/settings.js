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
let DEBUG = window.location.href.includes("DEBUG")


UFX.key.remaparrows(true)
UFX.key.remap({
	space: "action", enter: "action", Z: "action", // ctrl: "action", shift: "action",
	tab: "swap", caps: "swap",
	esc: "quit", Q: "quit", P: "quit",
	// TODO: portrait, toggledebug, fullscreen
})
