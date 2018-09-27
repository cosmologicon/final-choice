"use strict"

UFX.scenes.visit = {
	start: function (name) {
		this.name = "" + name
		sound.dplay(vdata[this.name].sname + "1")
		this.t = 0
		this.opt = 0
		this.starting = true
		this.popped = false
	},
	think: function (dt) {
		sound.mplay(1)
		let kstate = UFX.key.state()
		if (this.starting) {
			this.t += dt
		} else {
			this.t -= dt
			if (this.t <= 0 && !this.popped) this.finish()
		}
		if (this.starting && this.t > 1.5) {
			if (this.opt == 0 && (kstate.down.right || kstate.down.down)) {
				this.opt = 1
				sound.playsfx("select")
			} else if (this.opt == 1 && (kstate.down.left || kstate.down.up)) {
				this.opt = 0
				sound.playsfx("select")
			}
			if (kstate.down.action) {
				this.starting = false
				this.t = 1.5
				sound.playsfx("start")
			}
		}
	},
	finish: function () {
		this.popped = true
		if (this.opt == 0) {
			state.downgrade(vdata[this.name].do)
			sound.dplay(vdata[this.name].sname + "2")
			if (this.name == "7") {
				;"123456X".forEach(who => { state.saved[who] = false })
			} else {
				state.saved[this.name] = true
			}
		} else {
			sound.dplay(vdata[this.name].sname + "3")
		}
		UFX.scene.pop()
	},
	draw: function () {
		let data = vdata[this.name]
		draw.clear()
		draw.startalk()
		let talpha = Math.clamp((this.t - 1) * 2, 0, 1)
		let pimg = yswap(settings.portrait ? T(85, 85) : T(85, 85))
		let pyou = yswap(settings.portrait ? T(85, 660) : T(85, 400))
		let psay = yswap(settings.portrait ? T(180, 20) : T(180, 20))
		let pbox = [
			yswap(settings.portrait ? T(165, 605, 280, 95) : T(200, 350, 280, 110)),
			yswap(settings.portrait ? T(165, 710, 280, 95) : T(540, 350, 280, 110)),
		]
		
		pbox.forEach((box, jtext) => {
			let [x, y, w, h] = box, d = T(3)
			if (this.t < 1.5 && !(jtext == this.opt && !this.starting)) {
				y -= T(400 * Math.pow(1.5 - this.t, 2))
			}
			let flash = jtext == this.opt && this.t % 0.5 < 0.3
			let ocolor = flash ? [1, 1, 0.4] : [0.8, 0.8, 0]
			let fcolor = flash ? [0.4, 0.4, 0.4] : [0.2, 0.2, 0.2]
			draw.fill(ocolor, [x, y, w, h])
			draw.fill(fcolor, [x+d, y+d, w-2*d, h-2*d])
			gl.progs.text.use()
			UFX.gltext(data["opt" + jtext], {
				top: y + h - T(10),
				centerx: x + w / 2,
				fontname: "Lalezar",
				lineheight: 1,
				fontsize: T(20),
				width: T(260),
				color: "#7FF",
				gcolor: "#2EE",
				shadow: [1, 1],
				scolor: "black",
			})
			if (data["sub" + jtext].length) {
				UFX.gltext("(" + data["sub" + jtext] + ")", {
					top: y + h - T(65),
					centerx: x + w / 2,
					fontname: "Lalezar",
					fontsize: T(14),
					color: "#2FF",
					shadow: [1, 1],
					scolor: "black",
				})
			}
		})
		UFX.gltext(data.lines.join("\n\n"), {
			topleft: psay,
			width: T(settings.portrait ? 270 : 630),
			fontname: data.fontname,
			fontsize: T(data.fontsize),
			color: data.color,
			shadow: [1, 1],
			scolor: "black",
			alpha: talpha,
		})
		
//	image.Bdraw(data["avatar"], pimg, a = util.clamp(self.t * 3 - 0.3, 0, 1), showtitle = False)
//	image.Bdraw("bio-A", pyou, a = util.clamp(self.t * 3 - 1.3, 0, 1), showtitle = True)
		
		UFX.gltext(data.title, {
			midtop: [pimg[0], pimg[1] - T(70)],
			fontname: "Fjalla One",
			fontsize: T(16),
			alpha: talpha,
		})
		UFX.gltext(data.name, {
			midtop: [pimg[0], pimg[1] - T(90)],
			fontname: "Fjalla One",
			fontsize: T(16),
			color: "yellow",
			alpha: talpha,
		})
/*
		if settings.DEBUG:
			pos = T(475, 5) if settings.portrait else T(849, 5)
			ptext.draw("Encounter #%s\nAffects: %s" % (self.name, data["do"]), topright = pos, fontsize = T(32))
*/
	},
}



let vdata = {}
vdata["1"] = {
	"sname": "Paulson",
	"avatar": "bio-1",
	"title": "Ship's Doctor",
	"name": "Donovan Paulson",
	"lines": [
		"Thank heavens! I never expected anyone to find me this far from the evacuation fleet.",
		"I was a crew member onboard the Starship Hawking. As you probably know, we never completed our mission to close the rift. The ship was destroyed, but most of us managed to escape in these capsules. I imagine you might run into a few more of the crew, scattered like crumbs in the cosmos.... Crumbs....",
		"Sorry, I haven't had a good meal in weeks. Look, I've taken some damage. I'll never make it back to the fleet without some hull charge. If I could have some of yours... it's the only shot I've got. What do you say?",
	],
	"fontname": "Fjalla One",
	"fontsize": 18,
	"color": "#CFE",
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
	"fontname": "Londrina Solid",
	"fontsize": 17,
	"color": "#CFE",
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
	"fontname": "Passion One",
	"fontsize": 22,
	"color": "#CFE",
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
	"fontname": "Passion One",
	"fontsize": 20,
	"color": "#CFE",
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
	"fontname": "Londrina Solid",
	"fontsize": 22,
	"color": "#CFE",
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
	"fontname": "Passion One",
	"fontsize": 21,
	"color": "#CFE",
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
	"fontname": "Fjalla One",
	"fontsize": 16,
	"color": "#FCC",
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
	"fontname": "Londrina Solid",
	"fontsize": 22,
	"color": "#CFE",
	"opt0": "I can help you with that.",
	"sub0": "Decreased invulnerability from damage.",
	"opt1": "Don't worry. I'm sure someone else will come by....",
	"sub1": "",
	"do": "charge",
}

