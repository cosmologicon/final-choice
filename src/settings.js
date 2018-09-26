"use strict"

let settings = {
	portrait: true,
}

UFX.key.remaparrows(true)
UFX.key.remap({
	space: "action", enter: "action", ctrl: "action", shift: "action", Z: "action",
	tab: "swap", caps: "swap",
	esc: "quit",
	// TODO: portrait, toggledebug, fullscreen
})
