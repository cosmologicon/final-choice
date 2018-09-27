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

	apickup0: 30,
	
	scrollspeed: 40,
	yrange: 320,

	

	init: function () {
		this.you = null
		this.clear()
		this.restart()
		this.y0 = 0
		
		this.met = {}
		this.apickup = 0
	},
	clear: function () {
		this.yous = []
		this.goodbullets = []
		this.goodmissiles = []
		this.pickups = []
		this.planets = []
		this.enemies = []
		this.bosses = []
	},
	restart: function () {
		this.twin = 0
		this.tlose = 0
		this.tslow = 0
		this.tinvulnerable = 0
		this.xoffset = 0
	},
	think: function (dt) {
		let objs = this.yous.concat(this.goodbullets, this.goodmissiles, this.pickups, this.planets, this.enemies, this.bosses)
		objs.forEach(obj => obj.think(dt))

		;"yous goodbullets goodmissiles pickups enemies bosses planets".split(" ").forEach(gname => {
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


		let ymax = this.yrange - this.you.r
		let y0max = this.yrange - 240
		let a = y0max / (2 * Math.pow(ymax, 3))
		let b = 3 * Math.pow(ymax, 2) * a
		this.y0 = b * this.you.y - a * Math.pow(this.you.y, 3)
	},	
	draw: function () {
		let sprites = this.yous.concat(this.enemies, this.bosses, this.goodmissiles, this.pickups, this.planets)
		draw.sprites(sprites.map(sprite => sprite.spritedata()))
		let bullets = this.goodbullets
		draw.bullets(bullets.map(bullet => bullet.objdata()))
		
		gl.progs.text.use()
		this.planets.forEach(planet => planet.drawtext())
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
}
state.init()
