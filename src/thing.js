
// BASIC EXISTENCE

const Lives = {
	start: function () {
		this.alive = true
		this.t = 0
	},
	think: function (dt) {
		this.t += dt
	},
	die: function () {
		this.alive = false
	},
}

const Lifetime = {
	init: function (lifetime) {
		this.lifetime = lifetime === undefined ? 1 : lifetime
	},
	start: function () {
		this.f = 0
	},
	think: function (dt) {
		this.f = this.lifetime <= 0 ? 1 : Math.clamp(this.t / this.lifetime, 0, 1)
		if (this.f >= 1) this.alive = false
	},
}

// WORLD INTERACTION AND MOTION

const WorldBound = {}  // members: x, y

const ConstrainToScreen = {
	init: function (xmargin, ymargin) {
		this.xmargin = xmargin || 0
		this.ymargin = ymargin || 0
	},
	think: function (dt) {
		if (state.twin) return
		let dxmax = 427 - this.r - this.xmargin
		this.x = Math.clamp(this.x, -dxmax, dxmax)
		let dymax = state.yrange - this.r - this.ymargin
		this.y = Math.clamp(this.y, -dymax, dymax)
	},
}

const DisappearsOffscreen = {
	init: function (offscreenmargin) {
		this.offscreenmargin = offscreenmargin === undefined ? 20 : offscreenmargin
	},
	think: function (dt) {
		let xmax = 427 + this.r + this.offscreenmargin
		let ymax = state.yrange + this.r + this.offscreenmargin
		if (this.x * this.vx > 0 && Math.abs(this.x) > xmax) {
			this.alive = false
		}
		if (this.y * this.vy > 0 && Math.abs(this.y) > ymax) {
			this.alive = false
		}
	},
}

const LinearMotion = {
	start: function () {
		this.vx = 0
		this.vy = 0
	},
	think: function (dt) {
		this.x += dt * this.vx
		this.y += dt * this.vy
	},
}

const Accelerates = {
	start: function () {
		this.ax = 0
		this.ay = 0
	},
	think: function (dt) {
		this.vx += dt * this.ax
		this.vy += dt * this.ay
	},
}

const Tumbles = {
	init: function (omega) {
		this.omega = omega
	},
	start: function () {
		this.theta = 0
	},
	think: function (dt) {
		this.theta += this.omega * dt
	},
}

const YouBound = {
	init: function (omega, R) {
		this.omega = omega
		this.R = R
	},
	think: function (dt) {
		let theta = this.omega * this.t
		this.x = state.you.x + this.R * Math.cos(theta)
		this.y = state.you.y + this.R * Math.sin(theta)
	},
}

const SeeksEnemies = {
	init: function (v0) {
		this.v0 = v0
	},
	think: function (dt) {
		let target = null, r = 200
		state.enemies.concat(state.bosses).forEach(e => {
			if (e.hp <= 0) return
			let d = Math.hypot(this.x - e.x, this.y - e.y)
			if (d < r) {
				target = e
				r = d
			}
		})
		let ax = 2000, ay = 0
		if (target) {
			;[ax, ay] = Math.norm([target.x - this.x, target.y - this.y], 2000)
		}
		;[this.vx, this.vy] = Math.norm([this.vx + dt * ax, this.vy + dt * ay], this.v0)
	},
}

const SeeksHorizontalPosition = {
	init: function (vxmax, accel) {
		this.vxmax = vxmax
		this.xaccel = accel
	},
	start: function () {
		this.vx = 0
		this.xtarget = null
	},
	think: function (dt) {
		if (this.xtarget === null) return
		this.vx = Math.abs(this.vx)
		this.vx = Math.min(this.vx + dt * this.xaccel, this.vxmax)
		let dx = Math.abs(this.xtarget - this.x), v
		if (dx < 0.01) {
			v = 100
		} else {
			v = Math.min(this.vx, Math.sqrt(2 * 2 * this.xaccel * dx) + 1)
		}
		if (v * dt >= dx) {
			this.x = this.xtarget
			this.xtarget = null
			this.vx = 0
		} else {
			this.vx = this.xtarget > this.x ? v : -v
			this.x += this.vx * dt
		}
	},
}

const VerticalSinusoid = {
	init: function (yomega, yrange, y0) {
		this.yomega = yomega
		this.yrange = yrange
		this.y0 = y0 || 0
	},
	start: function () {
		this.ytheta = 0
	},
	think: function (dt) {
		this.ytheta += dt * this.yomega
		this.y = this.y0 + this.yrange * Math.sin(this.ytheta)
		this.vy = this.yrange * this.yomega * Math.cos(this.ytheta)
	},
}

// HEALTH

const InfiniteHealth = {
	init: function () {
		this.hp = 0
	},
	hurt: function () {
	},
}

const HasHealth = {
	init: function (hp0, iflashmax) {
		this.hp0 = hp0
		this.iflashmax = iflashmax === undefined ? 1 : iflashmax
	},
	start: function () {
		this.hp = this.hp0
	},
	hurt: function (damage) {
		if (this.hp <= 0) return
		this.hp -= damage
		this.iflash = this.iflashmax
		if (this.hp <= 0) {
			audio.playsfx(state.bosses.includes(this) ? "boss-die" : "enemy-die")
			this.die()
		} else {
			audio.playsfx("enemy-hurt")
		}
	},
}

// COLLISION

const Collides = {
	init: function (r) {
		this.r = r
	},
}

const DiesOnCollision = {
	hit: function () {
		this.die()
	},
}

const HurtsOnCollision = {
	init: function (damage) {
		this.damage = damage === undefined ? 1 : damage
	},
	hit: function (target) {
		if (target) target.hurt(this.damage)
	},
}

const Knockable = {
	start: function () {
		this.kx = 0
		this.ky = 0
	},
	knock: function (dkx, dky) {
		this.kx = dkx
		this.ky = dky
	},
	think: function (dt) {
		if (!this.kx && !this.ky) return
		let k = Math.hypot(this.kx, this.ky)
		let d = 300 * dt, dx, dy
		if (k < d) {
			dx = this.kx
			dy = this.ky
			this.kx = 0
			this.ky = 0
		} else {
			dx = this.kx * d / k
			dy = this.ky * d / k
			this.kx -= dx
			this.ky -= dy
		}
		this.x += dx
		this.y += dy
	},
}

const KnocksOnCollision = {
	init: function (dknock) {
		this.dknock = dknock || 10
	},
	hit: function (target) {
		if (target) {
			let [dx, dy] = Math.norm([target.x - this.x, target.y - this.y], this.dknock)
			target.knock(dx, dy)
		}
	},
}

const Visitable = {
	init: function (help) {
		this.help = help
	},
	visit: function () {
		if (!this.alive) return
		state.met[this.name] = true
		UFX.scene.push("visit", this.name)
		this.alive = false
	},
	drawtext: function () {
		if (!this.help) return
		if (state.met[this.name]) return
		let alpha = Math.clamp(Math.abs(this.t % 2 - 1) * 7, 0, 1)
		let pos = draw.screenpos([this.x + this.r, this.y - 2 * this.r])
		UFX.gltext("HELP!", {
			center: pos,
			fontsize: Math.ceil(20 * draw.f),
			fontname: "Bungee",
			alpha: alpha,
		})
	},
}

const Collectable = {
	think: function (dt) {
		let dx = state.you.x - this.x, dy = state.you.y - this.y
		if (Math.hypot(dx, dy) < state.rmagnet) {
			;[dx, dy] = Math.norm([dx, dy], 300 * dt)
			this.x += dx
			this.y += dy
		}
	},
	collect: function () {
		audio.playsfx("get")
		this.die()
	},
}

const HealsOnCollect = {
	init: function (heal) {
		this.heal = heal || 1
	},
	collect: function () {
		state.heal(this.heal)
	},
}

// ENEMY BEHAVIOR

const LetPickup = {
	init: function (apickup) {
		this.apickup = apickup || 0
	},
	die: function () {
		if (this.hp <= 0) {
			state.addapickup(this.apickup, this)
		}
	},
}

const BossBound = {
	init: function (diedelay) {
		this.diedelay = diedelay || 0
	},
	start: function () {
		this.target = null
	},
	think: function (dt) {
		if (!this.alive) return
		if (this.target && !this.target.alive) {
			this.diedelay -= dt
			if (this.diedelay <= 0) this.die()
		}
	},
}

const ABBullets = {
	init: function (nbullet, dtbullet) {
		this.nbullet = nbullet
		this.dtbullet = dtbullet
	},
	start: function () {
		this.tbullet = 0
		this.vbullet = 50
		this.jbullet = 0
	},
	think: function (dt) {
		this.tbullet += dt
		while (this.tbullet >= this.dtbullet) {
			for (let jtheta = 0 ; jtheta < this.nbullet ; ++jtheta) {
				let theta = (jtheta + this.jbullet / 2) / this.nbullet * Math.tau
				let dx = Math.cos(theta), dy = Math.sin(theta)
				let r = this.r + 2
				state.badbullets.push(new BadBullet({
					x: this.x + r * dx, y: this.y + r * dy,
					vx: this.vbullet * dx, vy: this.vbullet * dy,
				}))
			}
			this.tbullet -= this.dtbullet
			this.jbullet = 1 - this.jbullet
		}
	},
}

const RoundhouseBullets = {
	init: function (dtbullet) {
		this.dtbullet = dtbullet || 0.3
	},
	start: function () {
		this.tbullet = 0
		this.nbullet = 20
		this.vbullet = 50
		this.jbullet = 0
	},
	think: function (dt) {
		this.tbullet += dt
		while (this.tbullet >= this.dtbullet) {
			for (let jtheta = 0 ; jtheta < 3 ; ++jtheta) {
				let theta = (this.jbullet / this.nbullet + jtheta / 3) * Math.tau
				let dx = Math.cos(theta), dy = Math.sin(theta)
				let r = this.r + 2
				state.badbullets.push(new BadBullet({
					x: this.x + r * dx, y: this.y + r * dy,
					vx: this.vbullet * dx, vy: this.vbullet * dy,
				}))
			}
			this.tbullet -= this.dtbullet
			this.jbullet += 1
		}
	},
}

const SpawnsClusterBullets = {
	init: function (dtcb) {
		this.dtcb = dtcb
	},
	start: function () {
		this.tcb = 0
		this.jcb = 0
	},
	think: function (dt) {
		for (this.tcb += dt ; this.tcb >= this.dtcb ; this.tcb -= this.dtcb , ++this.jcb) {
			let y = (this.jcb * Math.phi % 1 * 2 - 1) * state.yrange
			state.badbullets.push(new BadClusterBullet({ x: 500, y: y, vx: -100, vy: 0 }))
		}
	},
}

const SeeksFormation = {
	init: function (vmax, accel) {
		this.vmax = vmax
		this.accel = accel
	},
	start: function () {
		this.v = 0
		this.vx = 0
		this.vy = 0
		this.target = null
		this.steps = []
	},
	think: function (dt) {
		while (this.steps.length && this.steps[0].t < this.t) {
			this.target = [this.steps[0].x, this.steps[0].y]
			this.steps = this.steps.slice(1)
		}
		if (!this.target) return
		this.v = Math.min(this.v + dt * this.accel, this.vmax)
		let [tx, ty] = this.target
		let dx = tx - this.x, dy = ty - this.y
		let d = Math.hypot(dx, dy)
		let v = d < 0.01 ? 100 : Math.min(this.v, Math.sqrt(4 * this.accel * d) + 1)
		if (v * dt >= d) {
			;[this.x, this.y] = this.target
			this.target = null
			this.v = 0
			this.vx = 0
			this.vy = 0
		} else {
			;[this.vx, this.vy] = Math.norm([dx, dy], v)
			this.x += this.vx * dt
			this.y += this.vy * dt
		}
	},
}

const ClustersNearYou = {
	init: function (nbullet, dyou, vbullet) {
		this.nbullet = nbullet
		this.dyou = dyou
		this.vbullet = vbullet || 50
	},
	think: function (dt) {
		if (!state.you.alive) return
		if (Math.hypot(this.x - state.you.x, this.y - state.you.y) < this.dyou) {
			let r = this.r
			for (let jtheta = 0 ; jtheta < this.nbullet ; ++jtheta) {
				let theta = jtheta / this.nbullet * Math.tau
				let dx = Math.cos(theta), dy = Math.sin(theta)
				state.badbullets.push(new BadBullet({
					x: this.x + r * dx, y: this.y + r * dy,
					vx: this.vbullet * dx, vy: this.vbullet * dy,
				}))
			}
			this.alive = false
			audio.playsfx("boom")
		}
	},
}

// DISPLAY

const DrawGlow = {
	objdata: function () {
		return {
			x: this.x, y: this.y,
			r: this.r,
			color: [0.8, 0.8, 1, 1],
		}
	},
}
const DrawFlash = {
	start: function () {
		this.dtflash = UFX.random()
	},
	objdata: function () {
		let color = (this.t + this.dtflash) * 5 % 1 > 0.5 ? [1, 0.5, 0.5, 1] : [1, 1, 0, 1]
		return {
			x: this.x, y: this.y,
			r: this.r,
			color: color,
		}
	},
}
const DrawCorpse = {
	objdata: function () {
		let alpha = 1 - this.f * this.f
		let color = this.t * 20 % 2 >= 1 ? [1, 0.5, 0.5, alpha] : [1, 1, 0, alpha]
		let r = this.r * (1 + this.f)
		return {
			x: this.x, y: this.y,
			r: r,
			color: color,
		}
	},
}
const LeavesCorpse = {
	die: function () {
		state.corpses.push(new Corpse({ x: this.x, y: this.y, r: this.r, }))
	},
}

const DrawAngleImage = {
	init: function (imgname, imgscale) {
		this.imgname = imgname
		this.imgscale = imgscale || 1
	},
	start: function () {
		this.iflash = 0
	},
	think: function (dt) {
		this.iflash = Math.max(this.iflash - dt, 0)
	},
	spritedata: function () {
		let scale = 0.01 * this.r * this.imgscale
		let A = -this.theta
		return {
			imgname: this.imgname,
			x: this.x, y: this.y,
			scale: scale,
			A: A,
			// cfilter = getcfilter(self.iflash))
		}
	},
}

const DrawFacingImage = {
	init: function (imgname, imgscale, ispeed) {
		this.imgname = imgname
		this.imgscale = imgscale || 1
		this.ispeed = ispeed || 0
		this.iflash = 0
	},
	think: function (dt) {
		this.iflash = Math.max(this.iflash - dt, 0)
	},
	spritedata: function () {
		let scale = 0.01 * this.r * this.imgscale
		let x = this.vx + this.ispeed, y = this.vy
		let angle = (x == 0 && y == 0) ? 0 : Math.atan2(y, x)
		return {
			imgname: this.imgname,
			x: this.x, y: this.y,
			scale: scale,
			A: angle,
		}
	},
}

// PLAYER CONTROL

const MovesWithArrows = {
	start: function () {
		this.vx = 0
		this.vy = 0
	},
	move: function (dt, dx, dy) {
		if (dx) this.vx = state.speed * dx
		if (dy) this.vy = state.speed * dy
		// TODO: looks like a bug - vx/vy are never used
		this.x += state.speed * dx * dt
		this.y += state.speed * dy * dt
	},
	think: function (dt) {
		let f = Math.exp(-10 * dt)
		this.vx *= f
		this.vy *= f
	},
}

const FiresWithSpace = {
	start: function () {
		this.tshot = 0  // time since last shot
	},
	think: function (dt) {
		this.tshot += dt
	},
	act: function () {
		if (this.tshot > state.reloadtime) this.shoot()
	},
	getcharge: function () {
		let t = this.tshot - state.reloadtime
		if (t <= 0 || state.chargetime > 100000) return 0
		if (t >= state.chargetime) return state.maxcharge
		return t / state.chargetime * state.maxcharge
	},
	getdamage: function () {
		return state.basedamage + Math.floor(this.getcharge())
	},
	getbulletsize: function () {
		return 3 * Math.pow(state.basedamage + this.getcharge(), 0.3)
	},
	shoot: function () {
		let r = this.r + 15
		let x0 = this.x + r
		let y0 = this.y
		let bullet = new GoodBullet({
			x: x0, y: y0,
			vx: 500, vy: 0,
			r: this.getbulletsize(),
			damage: this.getdamage(),
		})
		state.goodbullets.push(bullet)
		for (let jvshot = 0 ; jvshot < state.vshots ; ++jvshot) {
			let dx = -6 * (jvshot + 1)
			let dy = 8 * (jvshot + 1)
			state.goodbullets.push(new GoodBullet({
				x: x0 + dx, y: y0 + dy, vx: 500, vy: 0, r: 3, damage: 1, lifetime: 0.2, }))
			state.goodbullets.push(new GoodBullet({
				x: x0 + dx, y: y0 - dy, vx: 500, vy: 0, r: 3, damage: 1, lifetime: 0.2, }))
		}
		audio.playsfx("shot")
		this.tshot = 0
	},
	draw: function () {
		/* TODO: charge circle
		charge = self.getcharge()
		if charge <= 0: return
		pos = view.screenpos((self.x + self.r * 7, self.y))
		r = T(view.Z * self.getbulletsize())
		color = (255, 255, 255) if self.t * 4 % 1 > 0.5 else (200, 200, 255)
		*/
	},
}

const MissilesWithSpace = {
	start: function () {
		this.tmissile = 0  // time since last shot
		this.jmissile = false
	},
	think: function (dt) {
		this.tmissile += dt
	},
	act: function () {
		if (this.tmissile > state.missiletime) {
			this.shootmissile()
		}
	},
	shootmissile: function () {
		let dx = 0, dy = this.jmissile ? 1 : -1
		let r = this.r + 5
		state.goodmissiles.push(new GoodMissile({
			x: this.x + r * dx, y: this.y + r * dy,
			vx: 1000 * dx, vy: 1000 * dy,
		}))
		this.jmissile = !this.jmissile
		this.tmissile = 0
	},
}

const CShotsWithSpace = {
	start: function () {
		this.tcshot = 0  // time since last shot
	},
	think: function (dt) {
		this.tcshot += dt
	},
	act: function () {
		if (this.tcshot > state.cshottime) this.cshot()
	},
	cshot: function () {
		let r = this.r + 5
		for (let jshot = 2 ; jshot < 11 ; ++jshot) {
			let theta = jshot / 12 * Math.tau
			let dx = Math.cos(theta), dy = Math.sin(theta)
			state.goodbullets.push(new GoodBullet({
				x: this.x + r * dx, y: this.y + r * dy,
				vx: 500 * dx, vy: 500 * dy,
				r: 5,
				damage: 5,
			}))
		}
		this.tcshot = 0
	},
}

// PLAYER ABILITIES

const SpawnsCompanion = {
	start: function () {
		this.companion = null
	},
	think: function (dt) {
		if (this.companion === null && state.companion) {
			this.companion = new Companion({ x: this.x, y: this.y })
			this.companion.think(dt)
			state.yous.push(this.companion)
		}
		if (this.companion && !this.companion.alive) {
			this.companion = null
		}
		if (this.companion && !state.companion) {
			this.companion.alive = false
		}
	},
}



function You(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
You.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(MovesWithArrows)
	.addcomp(Knockable)
	.addcomp(FiresWithSpace)
	.addcomp(MissilesWithSpace)
	.addcomp(CShotsWithSpace)
	.addcomp(Collides, 5)
	.addcomp(SpawnsCompanion)
	.addcomp(ConstrainToScreen, 5, 5)
//	.addcomp(FlashesOnInvulnerable)
	.addcomp(DrawFacingImage, "you", 5, 1000)
	.addcomp(LeavesCorpse)
	.addcomp({
		hurt: function (damage) {
			state.takedamage(damage)
		},
	})

function Companion(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Companion.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(YouBound, 5, 25)
	.addcomp(Lives)
	.addcomp(Collides, 4)
	.addcomp(InfiniteHealth)
	.addcomp(Tumbles, 4)
	.addcomp(DrawAngleImage, "zap", 4)

function GoodBullet(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
GoodBullet.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Lifetime, 100)
	.addcomp(Collides, 3)
	.addcomp(LinearMotion)
	.addcomp(DiesOnCollision)
	.addcomp(HurtsOnCollision)
	.addcomp(DisappearsOffscreen)
	.addcomp(DrawGlow)

function GoodMissile(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
GoodMissile.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Collides, 5)
	.addcomp(SeeksEnemies, 300)
	.addcomp(LinearMotion)
	.addcomp(DiesOnCollision)
	.addcomp(HurtsOnCollision)
	.addcomp(DisappearsOffscreen)
	.addcomp(DrawFacingImage, "missile", 5)

function Capsule(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Capsule.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Collides, 16)
	.addcomp(LinearMotion)
	.addcomp(InfiniteHealth)
	.addcomp(Tumbles, 1)
	.addcomp(DrawAngleImage, "capsule", 1.7)
	.addcomp(Visitable, true)

function HealthPickup(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
HealthPickup.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Collides, 5)
	.addcomp(LinearMotion)
	.addcomp(Accelerates)
	.addcomp(Tumbles, 5)
	.addcomp(DrawAngleImage, "health", 5)
	.addcomp(Collectable)
	.addcomp(HealsOnCollect)
	// TODO: DisappearsOffscreen???


function BadBullet(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
BadBullet.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Collides, 3)
	.addcomp(LinearMotion)
	.addcomp(DiesOnCollision)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(DisappearsOffscreen)
	.addcomp(DrawFlash)

function BadClusterBullet(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
BadClusterBullet.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Collides, 6)
	.addcomp(LinearMotion)
	.addcomp(DiesOnCollision)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(ClustersNearYou, 20, 80)
	.addcomp(DisappearsOffscreen)
	.addcomp(DrawFlash)

function Duck(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Duck.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(HasHealth, 3)
	.addcomp(LetPickup, 1)
	.addcomp(Collides, 20)
	.addcomp(SeeksFormation, 400, 400)
	.addcomp(DisappearsOffscreen)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(LeavesCorpse)
	.addcomp(DrawFacingImage, "duck", 1.8, -100)

function Heron(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Heron.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(BossBound)
	.addcomp(HasHealth, 10)
	.addcomp(LetPickup, 1)
	.addcomp(Collides, 20)
	.addcomp(LinearMotion)
	.addcomp(DisappearsOffscreen)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(ABBullets, 12, 3)
	.addcomp(Tumbles, 2)
	.addcomp(DrawAngleImage, "heron", 1.5)
	.addcomp(LeavesCorpse)

function Emu(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Emu.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(HasHealth, 200)
	.addcomp(Collides, 100)
	.addcomp(RoundhouseBullets, 1)
	.addcomp(SeeksHorizontalPosition, 30, 30)
	.addcomp(VerticalSinusoid, 0.4, 120)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(SpawnsClusterBullets, 2)
	.addcomp(Tumbles, 0.4)
	.addcomp(DrawAngleImage, "heron", 1.5)
	.addcomp(LeavesCorpse)



function Corpse(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Corpse.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Lifetime, 0.2)
	.addcomp(Collides, 0)
	.addcomp(DrawCorpse)

