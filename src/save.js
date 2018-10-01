// Save state of both settings and progress.

"use strict"

let save = {
	name: "finalchoicesave",
	// Update the serialized save state to reflect the live state.
	// Call whenever settings, progress, or checkpoint changes.
	save: function () {
		let obj = {
			settings: settings,
			progress: progress,
			checkpoint: checkpoint,
		}
		localStorage[this.name] = obj
	},
	reset: function () {
		delete localStorage[this.name]
	},
	load: function () {
		if (!localStorage[this.name]) return
		let obj = JSON.parse(localStorage[this.name])
		if (!obj) return
		if ("settings" in obj) settings = obj.settings
		if ("progress" in obj) progress = obj.progress
		if ("checkpoint" in obj) checkpoint = obj.checkpoint
	},
}


