"use strict"

let settings = {
	portrait: false,
	fullscreen: false,
	swapaction: false,
	sfxvolume: 0.6,
	musicvolume: 0.6,
	dialogvolume: 0.6,
}
let DEBUG = window.location.href.includes("DEBUG")
let MIRACLE = window.location.href.includes("MIRACLE")

UFX.key.remaparrows(true)
UFX.key.remap({
	space: "action", enter: "action", Z: "action", X: "action", // ctrl: "action", shift: "action",
	tab: "swap", caps: "swap",
	esc: "quit", Q: "quit", P: "quit",
	F: "fullscreen", F11: "fullscreen",
	backspace: "aspect",
})
UFX.key.watchlist = [
	"up", "down", "left", "right", "action", "swap", "quit", "fullscreen", "aspect",
]
if (DEBUG) {
	UFX.key.watchlist = null
}
