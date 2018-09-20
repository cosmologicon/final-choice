
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
		UFX.audio.setgain("dialog", 1)

		let buffers = {
			fly: "data/music/flying.ogg",
			choose: "data/music/decision.ogg",
			ballad: "data/music/ballad.ogg",
		}
		for (let dname in Dlines) {
			Dlines[dname].forEach(line => {
				let sname = line[0]
				buffers[sname] = "data/dialog/" + sname + ".ogg"
			})
		}
		for (let cname in vdata) {
			for (let i of [1, 2, 3]) {
				let sname = vdata[cname].sname + i
				buffers[sname] = "data/dialog/" + sname + ".ogg"
			}
		}
		UFX.audio.loadbuffers(buffers)
		this.musicnodes = []
		this.voqueue = []
		this.vonode = null
	},
	think: function (dt) {
		if (this.voqueue.length && !this.vonode) this._advancevoqueue()
	},

	stopmusic: function () {
		this.musicnodes.forEach(buffer => buffer.cleanup())
		this.musicnodes = []
	},
	startgamemusic: function (pvolume) {
		if (!UFX.audio.context) return
		if (pvolume === undefined) pvolume = 1
		this.stopmusic()
		this.musicnodes = [
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
	setdialogvolume: function (volume) {
		if (!UFX.audio.context) return
		UFX.audio.setgain("dialog", Math.pow(volume, 1.9))
	},
	
	startendmusic: function () {
		if (!UFX.audio.context) return
		this.stopmusic()
		this.musicnodes = [
			UFX.audio.playbuffer("ballad", { name: "ballad", output: "endmusic", }),
		]
		UFX.audio.setgain("endmusic", 0)
		UFX.audio.setgain("endmusic", 1, {fade: 0.5})
	},

	stopdialog: function () {
		// TODO
	},

	// Voiceover (vo) refers to narrator and major character dialog
	currentvoline: function () {
		return this.voqueue.length ? this.voqueue[0] : null
	},
	playvoiceover: function (name) {
		if (!UFX.audio.context) return
		this.stopdialog()
		this.voqueue = Dlines[name]
		this._advancevoqueue(true)
	},
	_advancevoqueue: function (keep) {
		if (!keep) this.voqueue.shift()
		if (this.voqueue.length) {
			let [buffername, who, char, text] = this.voqueue[0]
			this.vonode = UFX.audio.playbuffer(buffername, { name: "vo", output: "dialog", })
			this.vonode.addEventListener("ended", () => { this.vonode = null })
		} else {
			this.vonode = null
		}
	},
	// One-off line by a Hawking crew memeber
	playline: function (name) {
		if (!UFX.audio.context) return
		this.stopdialog()
		UFX.audio.playbuffer(name, { output: "dialog", })
	},
}

// Voiceover lines
let Dlines = {}
Dlines["intro"] = [
	["Prologue1", null, "N", "Earth was in peril. A rift in spacetime was tearing through the cosmos, headed straight for the solar system."],
	["Prologue2", "bio-C", "N", "Under the command of General Maxwell Cutter of Earth space fleet, a new weapon was developed to seal the rift."],
	["Prologue3", "bio-7", "N", "The Starship Hawking, commanded by Cutter's son, Captain Gabriel, set out on the deadly mission to deploy the weapon and save humanity. The ship never returned."],
	["Prologue4", null, "N", "While the evacuation of Earth is underway, General Cutter himself is nowhere to be found."],
	["Prologue5", "bio-A", "N", `As Earth's end looms near, Captain Alyx, mother of one of the Hawking crew, receives a message from her daughter: "Find me at the rift."`],
]

Dlines["A"] = [
	["A1", "bio-J", "J", "Mother! You got my message!"],
	["A2", "bio-J", "J", "No time to explain. I've found out how to close the rift once and for all. It's the only chance to save Earth."],
	["A3", "bio-C", "C", "Not so fast."],
	["A4", "bio-J", "J", "General! What are you doing here?"],
	["A5", "bio-J", "J", "Listen, you need to move away from the rift. I'm going to close it!"],
	["A6", "bio-C", "C", "I can't let you do that. I don't know what I was ever thinking, trying to close this thing. But I'm a changed man now!"],
	["A7", "bio-C", "C", "And once the rift reaches Earth, you'll see just how powerful it is! Bwa ha ha!"],
	["A8", "bio-J", "J", "Mother, I don't know what's happened to him, but he has to be stopped. You take care of the fleet. I'll prepare to close the rift."],
	["A9", "bio-J", "J", "Don't worry about me. I'm far enough from the action that I'll be safe."],
]

Dlines["climax"] = [
	["C1", "bio-C", "C", "Noooo! This can't be happening!"],
	["C2", "bio-J", "J", "It's almost over.... The rift is closing.... uh oh."],
	["C3", "bio-J", "J", "There's an interdimensional mass imbalance. It won't close until something from our side goes through. At least fifty tons. A missile won't do."],
	["C4", "bio-J", "J", "General, get away from the rift! It's extremely unstable until something enters it."],
	["C5", "bio-C", "C", "I can't! I've lost engines! I've got less than a minute before I'm pulled into the gravity well!"],
	["C6", "bio-J", "J", "Wait, that's perfect! Your ship has enough mass, once you hit the rift, it'll close for good!"],
	["C7", "bio-C", "C", "My ship? What about me?! Won't that kill me?"],
	["C8", "bio-J", "J", "I'm sorry, General. It's you or the Earth now. It's the lesser of two evils."],
	["C9", "bio-C", "C", "Curse you, Alyx! Curse you, Jyn! Curse you Eaaaaaarth!"],
]
Dlines["climax2"] = [
	["C10", "bio-J", "J", "Mother, no!"],
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



let vdata = {}
vdata["1"] = {
	"sname": "Paulson",
	"avatar": "bio-1",
	"title": "Ship's Doctor",
	"name": "Donovan Paulson",
	"lines": [
		"Thank heavens! I never expected anyone to find me this far from the evacuation fleet.",
		"I was a crew member onboard the Starship Hawking. As you probably know, we never completed our mission to close the rift. The ship was destroyed, but most of us managed to escape in these capsules. I imagine you might run into a few more of the crew, scattered like crumbs in the cosmos....",
		"Sorry, I haven't had a good meal in weeks. Look, I've taken some damage. I'll never make it back to the fleet without some hull charge. If I could have some of yours... it's the only shot I've got. What do you say?",
	],
	"fontname": "FjallaOne",
	"fontsize": 18,
	"color": (200, 255, 240),
	"opt0": "All right, I can help you.",
	"sub0": "You will lose 3 health bars.",
	"opt1": "I'm sorry, I need everything I have for the dangers ahead.",
	"sub1": "",
	"do": "hp",
}
vdata["2"] = {
	"sname": "Danilowka",
	"avatar": "bio-2",
	"title": "Chief Mechanic",
	"name": "Sergey Danilowka",
	"lines": [
		"I never thought I'd wind up floating through space in one of these capsules. It's all those damn scientists' fault.",
		"You think my team had anything to do with what went wrong on the Hawking? No way, we had our jobs down pat. That weapon malfunctioned. Someone must have made a mistake. It's unthinkable.... to fail with so much on the line.",
		"I'll be honest, I won't get far in this mess. Your lateral weapons just happen to be compatible with the system I've got here. If you could spare them, I just might have a chance of surviving this.",
		"I mean, normally I wouldn't put such a big request on ya, but what the hell. The Earth will be gone soon, and nothing will matter anymore. If I could only hear my wife's voice one last time....",
	],
	"fontname": "LondrinaSolid",
	"fontsize": 17,
	"color": (200, 255, 240),
	"opt0": "All right, I'll help you.",
	"sub0": "You will lose your lateral weapons.",
	"opt1": "I'm sorry, I need everything I have for the dangers ahead.",
	"sub1": "",
	"do": "cshot",
}
vdata["3"] = {
	"sname": "Jusuf",
	"avatar": "bio-3",
	"title": "Security Chief",
	"name": "Boris Jusuf",
	"lines": [
		"Whoever you are, you're some pilot. These hostile ships are no joke.",
		"I floated out here for a week before seeing one. I thought it was a rescue at first, until they started firing!",
		"I'd like to know who the hell sent them. I don't expect to last long enough to find out, though, not with this crummy capsule anyway. Now that satellite of yours is something else. If I had something like that, I'd be out of here in no time!",
	],
	"fontname": "PassionOne",
	"fontsize": 22,
	"color": (200, 255, 240),
	"opt0": "Here, take it. Be safe.",
	"sub0": "You will lose your protective satellite.",
	"opt1": "Unfortunately I only have one of them, so I can't really help you there.",
	"sub1": "",
	"do": "companion",
}
vdata["4"] = {
	"sname": "Osaretin",
	"avatar": "bio-4",
	"title": "Head Engineer",
	"name": "Obed Osaretin",
	"lines": [
		"Ah, poor Gabriel. Earth will soon no longer be, and dear friend though he is, I'm afraid he must bear the burden. Quite awkward to be honest.",
		"I mean, it's not completely his fault. His only sin was trusting the General, his own father after all, over his own crew. General Cutter is a smart man, but preparations made in the comfort of the war room are no match for cold, hard reality,",
		"Jyn, she was our scientist, tried to tell Gabriel that the weapon would not work as planned, but as captain it was his ultimate call.",
		"Perhaps I wouldn't be having such morbid thoughts if I didn't feel so exposed out here. Is there any way you could help me?",
	],
	"fontname": "PassionOne",
	"fontsize": 20,
	"color": (200, 255, 240),
	"opt0": "I think you could use some shielding.",
	"sub0": "You will lose one shield bar.",
	"opt1": "I can offer you some words of encouragement. How about that?",
	"sub1": "",
	"do": "shield",
}
vdata["5"] = {
	"sname": "Tannenbaum",
	"avatar": "bio-5",
	"title": "Celestial Navigator",
	"name": "Axel Tannenbaum",
	"lines": [
		"Captain! I intercepted a radio broadcast meant for these alien ships. And you'll never guess who was giving the commands!",
		"General Cutter himself. He's out there, at the rift right now, sending these bloody ships to kill you!",
		"Well, kill you, kill me, kill anything in their path, really, so we're in this together.",
		"I'd definitely be a lot more help if I had a weapon, of course. Hey, can you spare those missile launchers? I could do some real damage with those!",
	],
	"fontname": "LondrinaSolid",
	"fontsize": 22,
	"color": (200, 255, 240),
	"opt0": "Here you go, with my regards!",
	"sub0": "You will lose your targeting missiles.",
	"opt1": "No way, kid. These things are dangerous. You'll put your eye out.",
	"sub1": "",
	"do": "missile",
}
vdata["6"] = {
	"sname": "Cooper",
	"avatar": "bio-6",
	"title": "First Officer",
	"name": "Lydia Cooper",
	"lines": [
		"Just goes to show, maybe the most important task shouldn't be given to someone just because he's family.",
		"I'm talking about Captain Gabriel, of course. Don't get me wrong, one of the best captains I ever met, but would he have made that same error in judgment if he wasn't Cutter's son?",
		"Oh, Jyn is your daughter? A fine crew member, but I'm afraid I have no idea what became of her after the accident. I hope you find her alive and well. I'm sure you will.",
		"If only I felt confident I could reach my loved ones again....",
	],
	"fontname": "PassionOne",
	"fontsize": 21,
	"color": (200, 255, 240),
	"opt0": "Hopefully this will help.",
	"sub0": "You will lose your short-range weapon.",
	"opt1": "Yes, well, sorry for your situation. Best of luck.",
	"sub1": "",
	"do": "vshot",
}
vdata["7"] = {
	"sname": "Gabriel",
	"avatar": "bio-7",
	"title": "Captain",
	"name": "P. Jim Gabriel",
	"lines": [
		"Well captain, you've come all this way, but you really don't have any idea what you're up against, do you?",
		"You think you can face my father? Why do you think I'm hiding from him here? He was never good with disappointment, and now he's gone completely mad. If he were to discover that the mission failed because of me, there's no telling what he would do to me.",
		"I can't let that secret out. I have to find the rest of the crew. You've found their capsules. Just give me their coordinates. I'll go... reason with them. You can trust me. I'd never hurt anyone, even though it's my own life we're talking about here!",
		"I'll tell you what. I can see that your ship has seen better days. You're in no condition for the fight ahead. But I can help you. I'll make your ship as good as new. Just give me their coordinates. Think about your daughter. Think about Earth. Deal?",
	],
	"fontname": "FjallaOne",
	"fontsize": 16,
	"color": (255, 200, 200),
	"opt0": "I suppose I have no choice.",
	"sub0": "You will regain all your downgrades.",
	"opt1": "I don't trust you, and I won't betray the crew to you.",
	"sub1": "",
	"do": "upgrade",
}
vdata["X"] = {
	"sname": "Graves",
	"avatar": "bio-X",
	"title": "Astro Pilot",
	"name": "Thornton Graves",
	"lines": [
		`"Everything is possible in space." That was General Cutter's favorite saying.`,
		"Funny, one possibility he never mentioned was getting stranded with no rescue in sight. If he loves space so much, why wasn't he on the mission?",
		"If you ever see him, let him know I'm out of the saving humanity business, if there's even any humanity left to save.",
		"One thing's for sure. I'm not going anywhere with this busted recovery system.",
	],
	"fontname": "LondrinaSolid",
	"fontsize": 22,
	"color": (200, 255, 240),
	"opt0": "I can help you with that.",
	"sub0": "Decreased invulnerability from damage.",
	"opt1": "Don't worry. I'm sure someone else will come by....",
	"sub1": "",
	"do": "charge",
}



	


