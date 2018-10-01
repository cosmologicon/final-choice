// The state object holds the frame-by-frame game state, including entities on screen etc.
// The checkpoint object holds the relevant part of the state at the beginning of the current wave,
//   i.e. enough to reconstruct the state if you die.
// The progress object holds which objectives have been completed on complete playthroughs.


"use strict"

function collided(obj1, obj2) {
	return Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y) < obj1.r + obj2.r
}
// TODO: I think this would be better as a spatial hash
function getcollisions(A, B) {
	if (!B.length) return []
	let ret = []
	let rmax = Math.max.apply(Math, B.map(b => b.r))
	B.sort((b1, b2) => b1.x - b2.x)
	let xs = B.map(b => b.x)
	A.forEach(a => {
		let drmax = a.r + rmax, bxmax = a.x + drmax
		for (let j = bisect(xs, a.x - drmax) ; j < B.length ; ++j) {
			let b = B[j]
			if (b.x > bxmax) break
			if (collided(a, b)) ret.push([a, b])
		}
	})
	return ret
}
function bisect(a, x) {
	let N = a.length
	if (!N || x <= a[0]) return 0
	if (x > a[N - 1]) return N
	let i = 0, j = N
	while (i + 1 < j) {  // a[i] < x <= a[j]
		let k = Math.floor((i + j) / 2)
		if (a[k] < x) i = k
		else j = k
	}
	return j
}

let progress = {
	beaten: false,  // Once the game has been beaten once (any ending) hard mode is unnlocked
	met: {},
	saved: {},
	good: false,
	best: false,
}
let checkpoint = null  // null = no checkpoint data.


let state = {

	speed: 200,
	hp0: 5,
	hp: 5,
	shieldhp0: 2,
	shieldhp: 2,
	shieldrate: 0.2,
	companion: true,
	basedamage: 1,
	reloadtime: 0.2,
	maxcharge: 9,
	chargetime: 3,
	vshots: 3,
	missiletime: 0.6,
	cshottime: 1,
	rmagnet: 200,
	dtinvulnerable: 1.5,

	apickup0: 30,
	
	scrollspeed: 40,
	yrange: 320,

	setbase: function () {
		this.shieldhp0 = this.miracle ? 4 : 2
		this.apickup0 = this.miracle ? 30 : 60
		this.shieldrate = this.miracle ? 0.2 : 0.1
	},

	downgrade: function (name) {
		if (name == "upgrade") {
			this.downgrades = []
		} else {
			this.downgrades.push(name)
		}
			
		switch (name) {
			case "hp":
				this.hp0 -= 3
				this.hp = Math.min(this.hp0, this.hp)
				break
			case "cshot":
				this.cshottime = 1e12
				break
			case "companion":
				this.companion = false
				break
			case "shield":
				this.shieldhp0 -= 1
				this.shieldhp = Math.min(this.shieldhp, this.shieldhp0)
				break
			case "missile":
				this.missiletime = 1e12
				break
			case "vshot":
				this.vshots = 0
				break
			case "charge":
				this.dtinvulnerable = 0.6
				break
			case "upgrade":
				this.hp = this.hp0 = 5
				this.cshottime = 1
				this.companion = true
				this.shieldhp0 = this.miracle ? 4 : 2
				this.shieldhp = this.shieldhp0
				this.missiletime = 0.6
				this.vshots = 3
				this.chargetime = 3
				break
		}
	},	

	// Reset checkpoint if any and start from stage 1
	// Set state.miracle to true before calling in easy mode.
	startgame: function () {
		this.stage = 1
		this.setbase()
		this.downgrades = []
		this.met = {}
		this.saved = {}
		this.apickup = 0
		checkpoint = null
		save.save()
	},
	// Load from checkpoint
	continuegame: function () {
		if (checkpoint === null) {
			this.startgame()
			return
		}
		this.miracle = checkpoint.miracle
		this.stage = checkpoint.stage
		this.setbase()
		this.downgrades = []
		checkpoint.downgrades.forEach(name => this.downgrade(name))
		this.met = checkpoint.met
		this.saved = checkpoint.saved
		this.apickup = checkpoint.apickup
	},
	// Call at the beginning of each stage.
	init: function () {
		this.you = null
		this.clear()
		this.restart()
		this.y0 = 0
		
		if (this.stage == 1) {
			checkpoint = null
		} else {
			checkpoint = {
				stage: this.stage,
				miracle: this.miracle,
				downgrades: this.downgrades,
				met: this.met,
				saved: this.saved,
				apickup: this.apickup,
			}
		}
		save.save()
	},
	clear: function () {
		this.yous = []
		this.goodbullets = []
		this.goodmissiles = []
		this.pickups = []
		this.planets = []
		this.enemies = []
		this.badbullets = []
		this.bosses = []
		this.spawners = []
		this.waves = []
	},
	restart: function () {
		this.twin = 0
		this.tlose = 0
		this.tslow = 0
		this.tinvulnerable = 0
		this.xoffset = 0
	},
	think: function (dt) {
		let objs = this.yous.concat(this.goodbullets, this.goodmissiles, this.pickups, this.planets,
			this.enemies, this.badbullets, this.bosses, this.spawners)
		objs.forEach(obj => obj.think(dt))


		;"yous goodbullets goodmissiles pickups enemies badbullets bosses planets spawners".split(" ").forEach(gname => {
			this[gname] = this[gname].filter(obj => obj.alive)
		})

		this.planets.forEach(obj => {
			if (collided(obj, this.you)) obj.visit()
		})
		this.pickups.forEach(obj => {
			if (collided(obj, this.you)) obj.collect()
		})

		objs = this.enemies.concat(this.bosses, this.planets)
		getcollisions(this.goodbullets.concat(this.goodmissiles), objs).forEach(pair => {
			let [b, e] = pair
			b.hit(e)
		})
		getcollisions(this.badbullets, this.yous.concat(this.planets)).forEach(pair => {
			let [b, e] = pair
			b.hit(e)
		})

		this.waves = this.waves.filter(wave => {
			let t = wave[0]
			if (this.you.t >= t) {
				this.addwave(wave)
				return false
			}
			return true
		})

		let ymax = this.yrange - this.you.r
		let y0max = this.yrange - 240
		let a = y0max / (2 * Math.pow(ymax, 3))
		let b = 3 * Math.pow(ymax, 2) * a
		this.y0 = b * this.you.y - a * Math.pow(this.you.y, 3)
		
		this.checkwin(dt)
	},
	checkwin: function (dt) {
		if (!this.waves.length && !this.bosses.length && !this.spawners.length && voplayer.done()) {
			this.twin += dt
			this.badbullets.forEach(bullet => {
				if (bullet.alive) {
					this.corspes.push(new Corpse({ x: bullet.x, y: bullet.y, r: bullet.r, lifetime: 1 }))
					bullet.alive = false
				}
			})
			if (this.twin > 2) {
				this.you.x += (this.twin - 2) * 1000 * dt
				if (this.you.x > 1000) this.win()
			}
		}
	},
	draw: function () {
		let sprites = this.yous.concat(this.enemies, this.bosses, this.goodmissiles, this.pickups, this.planets)
		draw.sprites(sprites.map(sprite => sprite.spritedata()))
		let bullets = this.goodbullets
		draw.bullets(bullets.map(bullet => bullet.objdata()))
		
		gl.progs.text.use()
		this.planets.forEach(planet => planet.drawtext())
		
		this.spawners.forEach(spawners => spawner.draw())
	},

	addapickup: function (amount, who) {
		let old = this.apickup
		this.apickup += amount
		if (old < this.apickup0 && this.apickup0 <= this.apickup) {
			this.spawnpickup(who, HealthPickup)
		}
		this.apickup %= this.apickup0
	},
	spawnpickup: function (who, PType) {
		this.pickups.push(new PType({
			x: who.x, y: who.y,
			vx: 200, vy: who.y < 0 ? 50 : -50,
			ax: -200,
		}))
	},


	addwave: function (wave) {
		let t = wave[0], func = wave[1], args = wave.slice(2)
		this[func].apply(this, args)
	},
	addformationwave: function (EType, x0, y0, nx, ny, steps) {
		let r = 50
		for (let jx = 0, j = 0 ; jx < nx ; ++jx) {
			for (let jy = 0 ; jy < ny ; ++jy, ++j) {
				let dx = (jx - (nx - 1) / 2) * r
				let dy = (jy - (ny - 1) / 2) * r
				let dt = Math.phi * j % 1
				let esteps = steps.map(step => {
					return { t: step[0] + dt, x: step[1] + dx, y: step[2] + dy }
				})
				this.enemies.push(new EType({ x: x0 + dx, y: y0 + dy, steps: esteps }))
			}
		}
	},
	addduckwave: function (x0, y0, nx, ny, steps) {
		this.addformationwave(Duck, x0, y0, nx, ny, steps)
	},


	heal: function (amount) {
		this.hp = Math.min(this.hp + amount, this.hp0)
	},

	savedall: function () {
		return "1234567X".split("").every(who => this.saved[who])
	},
	win: function () {
		switch (this.stage) {
			case 3:
				this.met.C = true
				this.met.J = true
			case 1: case 2:
				this.stage += 1
				UFX.scene.swap("play")
				break
			case 4:
				if (this.savedall()) {
					UFX.scene.swap("climax")
				} else {
					UFX.scene.swap("win")
				}
				break
		}
	},
}
