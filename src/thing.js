
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

// WORLD INTERACTION

const WorldBound = {}  // members: x, y

const Collides = {
	init: function (r) {
		this.r = r
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


// DISPLAY

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
		let x = this.vx + this.ispeed, y = -this.vy
		let angle = (x == 0 && y == 0) ? 0 : Math.atan2(y, x)
		console.log(this.vx, this.vy, x, y, angle)
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
		let t = this.tshot - statereloadtime
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
			state.goodbullets.append(new RangeGoodBullet({
				x: x0 + dx, y: y0 + dy, vx: 500, vy: 0, r: 3, damage: 1, lifetime: 0.2, }))
			state.goodbullets.append(new RangeGoodBullet({
				x: x0 + dx, y: y0 - dy, vx: 500, vy: 0, r: 3, damage: 1, lifetime: 0.2, }))
		}
		sound.playsfx("shot")
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
		state.goodbullets.push(new GoodMissile({
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
		if (this.tcshot > this.cshottime) this.cshot()
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
			this.tcshot = 0
		}
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
//	.addcomp(MissilesWithSpace)
//	.addcomp(CShotsWithSpace)
	.addcomp(Collides, 5)
//	.addcomp(SpawnsCompanion)
	.addcomp(ConstrainToScreen, 5, 5)
//	.addcomp(FlashesOnInvulnerable)
	.addcomp(DrawFacingImage, "you", 5, 1000)
//	.addcomp(LeavesCorpse)
	.addcomp({
		hurt: function (damage) {
			state.takedamage(damage)
		},
	})

