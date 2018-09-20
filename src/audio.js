
"use strict"
let audio = {
	// The quiet factor is a per-sfx value that is used to attenuate the sound effect's volume if
	// it's played multiple times in fast succession.
	quiet: {},

	tmusicfade: 2,

	init: function () {
		UFX.audio.init()
		UFX.audio.makegainnode({ name: "sound" })
		UFX.audio.makegainnode({ name: "sfx", output: "sound" })
		UFX.audio.makegainnode({ name: "music", output: "sound" })
		UFX.audio.makegainnode({ name: "gamemusic", output: "music" })
		UFX.audio.makegainnode({ name: "endmusic", output: "music" })
		UFX.audio.makegainnode({ name: "dialog" })
		UFX.audio.setgain("endmusic", 0)
		UFX.audio.setgain("dialog", 0)

		UFX.audio.loadbuffers({
			fly: "data/music/flying.ogg",
			choose: "data/music/decision.ogg",
			ballad: "data/music/ballad.ogg",
		})
		this.musicbuffers = []
	},

	stopmusic: function () {
		this.musicbuffers.forEach(buffer => buffer.cleanup())
		this.musicbuffers = []
	},
	startgamemusic: function (pvolume) {
		if (!UFX.audio.context) return
		if (pvolume === undefined) pvolume = 1
		this.stopmusic()
		this.musicbuffers = [
			UFX.audio.playbuffer("fly", { name: "fly", output: "gamemusic", loop: true, gain: pvolume, cleanup: true, }),
			UFX.audio.playbuffer("choose", { name: "choose", output: "gamemusic", loop: true, gain: 1 - pvolume, cleanup: true, }),
		]
	},
	tofly: function () {
		if (!UFX.audio.context) return
		UFX.audio.setgain("fly_gain", 1, {fade: this.tmusicfade})
		UFX.audio.setgain("choose_gain", 0, {fade: this.tmusicfade})
	},
	tochoose: function () {
		if (!UFX.audio.context) return
		UFX.audio.setgain("fly_gain", 0, {fade: this.tmusicfade})
		UFX.audio.setgain("choose_gain", 1, {fade: this.tmusicfade})
	},
	setmusicvolume: function (volume) {
		if (!UFX.audio.context) return
		UFX.audio.setgain("music", Math.pow(volume, 1.9))
	},
	
	startendmusic: function () {
		if (!UFX.audio.context) return
		this.stopmusic()
		this.musicbuffers = [
			UFX.audio.playbuffer("ballad", { name: "ballad", output: "endmusic", }),
		]
		UFX.audio.setgain("endmusic", 0)
		UFX.audio.setgain("endmusic", 1, {fade: 0.5})
	},


}
