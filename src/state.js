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
let progress0 = JSON.parse(JSON.stringify(progress))
function resetprogress() {
	progress = JSON.parse(JSON.stringify(progress0))
	save.save()
}

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
	recordprogress: function () {
		for (let s in this.met) progress.met[s] = this.met[s]
		for (let s in this.saved) progress.saved[s] = this.saved[s]
		progress.bad |= this.bad
		progress.good |= this.good()
		progress.best |= this.best()
		save.save()
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
		this.rocks = []
		this.enemies = []
		this.badbullets = []
		this.bosses = []
		this.corpses = []
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
		this.shieldhp = Math.min(this.shieldhp + this.shieldrate * dt, this.shieldhp0)

		let objs = this.yous.concat(this.goodbullets, this.goodmissiles, this.pickups, this.planets,
			this.rocks, this.enemies, this.badbullets, this.bosses, this.spawners, this.corpses)
		objs.forEach(obj => obj.think(dt))


		;"yous goodbullets goodmissiles pickups rocks enemies badbullets bosses planets spawners corpses".split(" ").forEach(gname => {
			this[gname] = this[gname].filter(obj => obj.alive)
		})

		this.rocks.concat(this.enemies, this.bosses).forEach(obj => {
			if (collided(obj, this.you)) obj.hit(this.you)
		})
		this.planets.forEach(obj => {
			if (collided(obj, this.you)) obj.visit()
		})
		this.pickups.forEach(obj => {
			if (collided(obj, this.you)) obj.collect()
		})

		objs = this.enemies.concat(this.rocks, this.bosses, this.planets)
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
					this.corpses.push(new Corpse({ x: bullet.x, y: bullet.y, r: bullet.r, lifetime: 1 }))
					bullet.alive = false
				}
			})
			if (this.twin > 2) {
				this.you.x += (this.twin - 2) * 1000 * dt
				if (this.you.x > 1000) this.win()
			}
		}
	},
	cheat: function () {
		this.waves = []
		this.bosses = []
		this.spawners = []
	},
	draw: function () {
		draw.rocks(this.rocks.map(rock => rock.rockdata()))
		let sprites = this.yous.concat(this.enemies, this.bosses, this.goodmissiles, this.pickups, this.planets)
		draw.sprites(sprites.map(sprite => sprite.spritedata()))
		let bullets = this.goodbullets.concat(this.badbullets, this.corpses)
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
	playvo: function (name) {
		audio.playvoiceover(name)
	},

	addcapsule: function (name, x, y, vx, vy) {
		if (this.saved[name]) return
		this.planets.push(new Capsule({ name: name, x: x, y: y, vx: vx, vy: vy, }))
	},
	addasteroids: function (n, x0, j0) {
		j0 = j0 || 0
		for (let j = j0 ; j < j0 + n ; ++j) {
			let c = UFX.random(0.6, 0.9)
			let color = [c + UFX.random(0.05), c + UFX.random(0.05), c + UFX.random(0.05)]
			let [dx, dy, dr, dvx] = randomrock[j]
			let x = x0 + 200 * dx
			let y = (dy * 2 - 1) * state.yrange
			let r = Math.round((30 + 40 * dr) / 20) * 20
			let vx = -20 - 40 * dvx
			let vy = (dvx * 1000 % 1 * 2 - 1) * 2
			this.rocks.push(new Rock({ x: x, y: y, vx: vx, vy: vy, r: r, hp: Math.floor(r * 0.7), color0: color, }))
		}
	},
	addbluerock: function (x, y, vx, vy) {
		if (this.saved.X) return
		this.rocks.push(new BlueRock({ x: x, y: y, vx: vx, vy: vy }))
	},

	addformationwave: function (EType, r, x0, y0, nx, ny, steps) {
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
		this.addformationwave(Duck, 50, x0, y0, nx, ny, steps)
	},
	addturkeywave: function (x0, y0, nx, ny, steps) {
		this.addformationwave(Turkey, 100, x0, y0, nx, ny, steps)
	},
	addlarkwave: function (n, x0, y0, vy0, dy0, cr) {
		let dj = vy0 < 0 ? 20 : -20
		for (let j = 0 ; j < n ; ++j) {
			this.enemies.push(new Lark({ x0: x0, y0: y0, dy0: dy0 + dj * j, vy0: vy0, cr: cr, dydtheta: 50 }))
		}
	},
	addclusterbombs: function (n, t, x0, y0, dx, dy, vx, vy) {
		for (let j = 0 ; j < n ; ++j) {
			let dt = j / n * t
			let x = x0 + j * Math.phi % 1 * dx - vx * dt
			let y = y0 + j * Math.phi % 1 * dy - vy * dt
			this.badbullets.push(new BadClusterBullet({ x: x, y: y, vx: vx, vy: vy }))
		}
	},

	addheronsplash(nx, ny, x0) {
		if (x0 === undefined) x0 = 1000
		for (let ax = 0 ; ax < nx ; ++ax) {
			for (let ay = 0 ; ay < ny ; ++ay) {
				this.enemies.push(new Heron({
					x: x0,
					y: (ay - (ny - 1) / 2) / ny * 2 * 300,
					vx: -40 - 20 * ax,
					vy: 0,
				}))
			}
		}
	},
	addcobra: function (n, r, x0, y0, dx, dy, p0, h) {
		for (let jseg = 0 ; jseg < n ; ++jseg) {
			this.enemies.push(new Cobra({
				x0arc: x0, y0arc: y0, dxarc: dx, dyarc: dy,
				p0arc: p0, harc: h, r: r,
			}))
			p0 -= r * 0.8
			r *= 0.95
		}
	},

	addemu: function () {
		this.bosses.push(new Emu({ x: 600, y: 0, xtarget: 100 }))
	},
	addegret: function () {
		let egret = new Egret({ x: 600, y: 0, xtarget0: 280 })
		this.bosses.unshift(egret)
	},
	addmedusa: function () {
		let boss = new Medusa({ x: 600, y: 0, xtarget: 350 })
		this.bosses.push(boss)
		for (let jtheta = 0 ; jtheta < 3 ; ++jtheta) {
			for (let jr = 0 ; jr < 7 ; ++jr) {
				let r = 20 * Math.pow(0.92, jr)
				let theta0 = (jtheta / 3 + jr / 40) * Math.tau
				let theta1 = (jtheta / 3 - jr / 70) * Math.tau
				let diedelay = 0.5 + 0.2 * jr
				this.enemies.push(
					new Asp({ target: boss, omega: -0.8, R: 100, theta: theta0, r: r, diedelay: diedelay }),
					new Asp({ target: boss, omega: 0.5, R: 150, theta: theta1, r: r, diedelay: diedelay })
				)
			}
		}
	},

	heal: function (amount) {
		this.hp = Math.min(this.hp + amount, this.hp0)
	},
	takedamage: function (damage) {
		if (this.tinvulnerable) return
		while (this.shieldhp >= 1 && damage) {
			this.shieldhp -= 1
			damage -= 1
		}
		this.hp -= damage
		this.tinvulnerable = this.dtinvulnerable
		this.you.iflash = this.tinvulnerable
		if (this.hp <= 0) {
			this.you.die()
			audio.playsfx("you-die")
		} else {
			audio.playsfx("you-hurt")
		}
	},

	savedall: function () {
		return "123456X".split("").every(who => this.saved[who])
	},
	good: function () {
		return this.savedall()
	},
	best: function () {
		return this.savedall() && this.saved.C
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
