
// If init is not called, or the Web Audio context is disabled for whatever reason, then all methods
// of this object are no-ops, and are safe to call.

"use strict"
let audio = {
	basedir: "data",
	sfxnames: "boom boss-die enemy-die enemy-hurt get select shot0 shot1 shot2 start you-die you-hurt".split(" "),
	// The quiet factor is a per-sfx value that is used to attenuate the sound effect's volume if
	// it's played multiple times in fast succession. Every time a sound is played its corresponding
	// quiet factor is increased by 1, and all quiet factors decay back to 0 over time. The larger
	// the quiet factor when a sound is played, the quieter the sound.
	quiet: {},

	tmusicfade: 1,

	// The gamma factor controls how the volume slider relates to the actual amplitude of the wave
	// form. A gamma factor greater than 1 means you have finer control at low volumes, and a gamma
	// factor less than 1 means you have finer control at high volumes.
	gamma: 1.7,

	// For tracking progress of individual audio tracks.
	tstart: {},

	init: function () {
		voplayer.init()
		UFX.audio.init()
		if (!UFX.audio.context) {
			window.alert("HTML5 Audio context required for sound support.")
			return
		}
		UFX.audio.makegainnode({ name: "main" })  // Only adjusted during pausing.
		UFX.audio.makegainnode({ name: "sound", output: "main" })
		UFX.audio.makegainnode({ name: "sfx", output: "sound" })
		UFX.audio.makegainnode({ name: "musicfade", output: "sound" })
		UFX.audio.makegainnode({ name: "music", output: "musicfade" })
		UFX.audio.makegainnode({ name: "gamemusic", output: "music" })
		UFX.audio.makegainnode({ name: "flygain", output: "gamemusic" })
		UFX.audio.makegainnode({ name: "choosegain", output: "gamemusic" })
		UFX.audio.makegainnode({ name: "endmusic", output: "music" })
		UFX.audio.makegainnode({ name: "dialog", output: "main" })
		UFX.audio.setgain("endmusic", 0)
		UFX.audio.setgain("dialog", 1)

		let buffers = {
			fly: this.basedir + "/music/flying.ogg",
			choose: this.basedir + "/music/decision.ogg",
			ballad: this.basedir + "/music/ballad.ogg",
		}
		for (let dname in Dlines) {
			Dlines[dname].forEach(line => {
				let sname = line[0]
				buffers[sname] = this.basedir + "/dialog/" + sname + ".ogg"
			})
		}
		for (let cname in vdata) {
			for (let i of [1, 2, 3]) {
				let sname = vdata[cname].sname + i
				buffers[sname] = this.basedir + "/dialog/" + sname + ".ogg"
			}
		}
		this.sfxnames.forEach(sname => {
			buffers[sname] = this.basedir + "/sfx/" + sname + ".ogg"
		})
		UFX.audio.loadbuffers(buffers)
		this.musicnodes = []
		this.dialognode = null
		this.on = true
		this.offtimer = 0
		
		this.setsfxvolume(settings.sfxvolume)
		this.setmusicvolume(settings.musicvolume)
		this.setdialogvolume(settings.dialogvolume)
	},
	think: function (dt) {
		let f = Math.exp(-2 * dt)
		for (let sname in this.quiet) this.quiet[sname] *= f
		if (this.offtimer) {
			this.offtimer = Math.max(this.offtimer - dt, 0)
			if (!this.offtimer) this.suspend()
		}
		voplayer.think(dt)
		let talking = !voplayer.done() || this.dialognode
		let soundgain0 = UFX.audio.getgain("sound")
		let soundgain = Math.clamp(soundgain0 + dt * (talking ? -2 : 2), 0.3, 1)
		if (soundgain != soundgain0) UFX.audio.setgain("sound", soundgain)
	},
	suspend: function () {
		if (!UFX.audio.context) return
		UFX.audio.context.suspend()
		this.on = false
	},
	resume: function () {
		if (!UFX.audio.context) return
		UFX.audio.context.resume()
		this.on = true
	},
	fadeout: function (dt) {
		if (!UFX.audio.context) return
		if (dt === undefined) dt = 0.3
		UFX.audio.setgain("main", 0, { fade: dt })
		this.offtimer = dt
	},
	fadein: function (dt) {
		if (!UFX.audio.context) return
		if (dt === undefined) dt = 0.3
		if (this.offtimer) this.offtimer = 0
		this.resume()
		UFX.audio.setgain("main", 1, { fade: dt })
	},

	playsfx: function (sname) {
		if (!UFX.audio.context) return
		let Q = this.quiet[sname] || 0
		let volume = Math.exp(-0.7 * Q)
		let bname = sname
		if (bname == "shot") bname += UFX.random.choice([0, 1, 2])
		UFX.audio.playbuffer(bname, { name: bname, output: "sfx", gain: volume }),
		this.quiet[sname] = Q + 1
		this.tstart[sname] = UFX.audio.context.currentTime
	},
	progress: function (sname) {
		console.log(sname, UFX.audio.nodes[sname], this.tstart[sname])
		if (!UFX.audio.nodes[sname]) return null
		if (!(sname in this.tstart)) return null
		let dt = UFX.audio.context.currentTime - this.tstart[sname]
		let f = dt / UFX.audio.nodes[sname].buffer.duration
		if (UFX.audio.nodes[sname].loop) f %= 1
		return Math.min(Math.max(f, 0), 1)
	},

	stopmusic: function () {
		if (!UFX.audio.context) return
		this.musicnodes.forEach(buffer => buffer.cleanup())
		this.musicnodes = []
	},
	startgamemusic: function (pvolume) {
		if (!UFX.audio.context) return
		if (pvolume === undefined) pvolume = 1
		this.stopmusic()
		this.tochoose(0)
		this.musicnodes = [
			UFX.audio.playbuffer("fly", { name: "fly", output: "flygain", loop: true, cleanup: true, }),
			UFX.audio.playbuffer("choose", { name: "choose", output: "choosegain", loop: true, cleanup: true, }),
		]
		UFX.audio.setgain("musicfade", 0)
		UFX.audio.setgain("musicfade", 1, { fade: 5, })
		this.tstart.fly = UFX.audio.context.currentTime
		this.tstart.choose = UFX.audio.context.currentTime
	},
	tofly: function (dt) {
		if (!UFX.audio.context) return
		if (dt === undefined) dt = this.tmusicfade
		UFX.audio.setgain("flygain", 1, {fade: dt})
		UFX.audio.setgain("choosegain", 0, {fade: dt})
	},
	tochoose: function (dt) {
		if (!UFX.audio.context) return
		if (dt === undefined) dt = this.tmusicfade
		UFX.audio.setgain("flygain", 0, {fade: dt})
		UFX.audio.setgain("choosegain", 1, {fade: dt})
	},
	setsfxvolume: function (volume) {
		if (!UFX.audio.context) return
		UFX.audio.setgain("sfx", Math.pow(volume, this.gamma))
	},
	setmusicvolume: function (volume) {
		if (!UFX.audio.context) return
		UFX.audio.setgain("music", Math.pow(volume, this.gamma))
	},
	setdialogvolume: function (volume) {
		if (!UFX.audio.context) return
		UFX.audio.setgain("dialog", Math.pow(volume, this.gamma))
	},
	
	startendmusic: function () {
		if (!UFX.audio.context) return
		this.stopmusic()
		this.musicnodes = [
			UFX.audio.playbuffer("ballad", { name: "ballad", output: "endmusic", }),
		]
		UFX.audio.setgain("endmusic", 0)
		UFX.audio.setgain("endmusic", 1, {fade: 0.5})
		this.tstart.ballad = UFX.audio.context.currentTime
	},

	stopdialog: function () {
		if (!UFX.audio.context) return
		if (this.dialognode !== null) {
			this.dialognode.stop()
			this.dialognode.cleanup()
			this.dialognode = null
		}
	},

	playvoiceover: function (name) {
		voplayer.init(name)
	},

	// One-off line by a Hawking crew memeber
	playline: function (name) {
		if (!UFX.audio.context) return
		this.stopdialog()
		let dialognode = UFX.audio.playbuffer(name, { output: "dialog", })
		this.dialognode = dialognode
		dialognode.addEventListener("ended", () => { if (this.dialognode === dialognode) this.dialognode = null })
		return this.dialognode
	},
}

// Manage voiceover (vo), refering to narrator and major character dialog
let voplayer = {
	init: function (name) {
		audio.stopdialog()
		this.queue = name ? Dlines[name].slice() : []
		this.alpha = 0
		this.advance()
	},
	stop: function () {
		if (this.node) this.node.cleanup()
		this.node = null
		this.queue = []
		this.current = null
		this.alpha = 0
	},
	think: function (dt) {
		if (this.done()) return
		this.tcurrent = Math.max(this.tcurrent - dt, 0)
		if (this.quiet()) {
			this.alpha = Math.max(this.alpha - 3 * dt, 0)
			if (this.alpha == 0) this.advance()
		} else {
			this.alpha = Math.min(this.alpha + 3 * dt, 1)
		}
	},
	advance: function () {
		if (!this.queue.length) {
			this.current = null
			return
		}
		this.current = this.queue.shift()
		let [buffername, avatar, who, text] = this.current
		if (UFX.audio.context) {
			this.node = UFX.audio.playbuffer(buffername, { name: "vo", output: "dialog", })
			this.node.addEventListener("ended", () => { this.node = null })
			this.tcurrent = 0
		} else {
			this.node = null
			this.tcurrent = 0.3 + 0.05 * text.length
		}
	},
	// Whether the currently-playing line has ended.
	quiet: function () {
		return this.node == null && this.tcurrent == 0
	},
	done: function () {
		return this.current == null && !this.queue.length && this.alpha == 0
	},
	fonts: {
		N: ["Fjalla One", 21, "#BBF", 1.2],
		J: ["Lalezar", 21, "#BFB", 1],
		C: ["Bungee", 18, "#FA5", 1.2],
	},
	draw: function () {
		if (!this.current || this.alpha == 0) return
		let [buffername, avatar, who, text] = this.current
		if (avatar !== null) {
			let pos = yswap(settings.portrait ? T(56, 800) : T(100, 426))
			draw.avatar(avatar, pos, T(90), this.alpha, true)
		}
		let [fontname, fontsize, color, lineheight] = this.fonts[who] || [null, 28, "white", 1]
		fontsize = T(fontsize)
		let width = settings.portrait ? T(340) : T(540)
		let pos = yswap(settings.portrait ? T(110, 846) : T(170, 472))
		gl.progs.text.use()
		gl.progs.text.draw(text, {
			bottomleft: pos, width: width,
			fontname: fontname, fontsize: fontsize, lineheight: lineheight,
			color: color, scolor: "black", alpha: this.alpha,
		})
	},
}

// Voiceover lines
let Dlines = {}
Dlines["intro"] = [
	["Prologue1", null, "N", "Earth was in peril. A rift in spacetime was tearing through the cosmos, headed straight for the solar system."],
	["Prologue2", "C", "N", "Under the command of General Maxwell Cutter of Earth space fleet, a new weapon was developed to seal the rift."],
	["Prologue3", "7", "N", "The Starship Hawking, commanded by Cutter's son, Captain Gabriel, set out on the deadly mission to deploy the weapon and save humanity. The ship never returned."],
	["Prologue4", null, "N", "While the evacuation of Earth is underway, General Cutter himself is nowhere to be found."],
	["Prologue5", "A", "N", `As Earth's end looms near, Captain Alyx, mother of one of the Hawking crew, receives a message from her daughter: "Find me at the rift."`],
]

Dlines["A"] = [
	["A1", "J", "J", "Mother! You got my message!"],
	["A2", "J", "J", "No time to explain. I've found out how to close the rift once and for all. It's the only chance to save Earth."],
	["A3", "C", "C", "Not so fast."],
	["A4", "J", "J", "General! What are you doing here?"],
	["A5", "J", "J", "Listen, you need to move away from the rift. I'm going to close it!"],
	["A6", "C", "C", "I can't let you do that. I don't know what I was ever thinking, trying to close this thing. But I'm a changed man now!"],
	["A7", "C", "C", "And once the rift reaches Earth, you'll see just how powerful it is! Bwa ha ha!"],
	["A8", "J", "J", "Mother, I don't know what's happened to him, but he has to be stopped. You take care of the fleet. I'll prepare to close the rift."],
	["A9", "J", "J", "Don't worry about me. I'm far enough from the action that I'll be safe."],
]

Dlines["climax"] = [
	["C1", "C", "C", "Noooo! This can't be happening!"],
	["C2", "J", "J", "It's almost over.... The rift is closing.... uh oh."],
	["C3", "J", "J", "There's an interdimensional mass imbalance. It won't close until something from our side goes through. At least fifty tons. A missile won't do."],
	["C4", "J", "J", "General, get away from the rift! It's extremely unstable until something enters it."],
	["C5", "C", "C", "I can't! I've lost engines! I've got less than a minute before I'm pulled into the gravity well!"],
	["C6", "J", "J", "Wait, that's perfect! Your ship has enough mass, once you hit the rift, it'll close for good!"],
	["C7", "C", "C", "My ship? What about me?! Won't that kill me?"],
	["C8", "J", "J", "I'm sorry, General. It's you or the Earth now. It's the lesser of two evils."],
	["C9", "C", "C", "Curse you, Alyx! Curse you, Jyn! Curse you Eaaaaaarth!"],
]
Dlines["climax2"] = [
	["C10", "J", "J", "Mother, no!"],
]

Dlines["B"] = [
	["B1", null, "N", "Earth was saved, but Jyn set off to locate the remaining survivors of the Hawking, and was never heard from again."],
]
Dlines["D"] = [
	["D1", null, "N", "Jyn and Alyx returned to Earth and received a heroes' welcome. And the mysteries of what lies beyond the rift remained locked away from humanity forever."],
]
Dlines["E"] = [
	["E1", null, "N", "With a heavy heart, Jyn took General Cutter into custody and returned to Earth, along with the rest of the crew of the Starship Hawking."],
	["E2", null, "N", "Cutter's account of what he had seen beyond the rift allowed Jyn to develop a interdimensional hyperdrive, that in time would enable humanity to reach beyond the stars...."],
]

