
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

const SeeksYou = {
	init: function (v0) {
		this.v0 = v0 || 200
	},
	think: function (dt) {
		let target = state.you
		let [ax, ay] = Math.norm([target.x - this.x, target.y - this.y], 2000)
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
const SeeksHorizontalSinusoid = {
	init: function (vxmax0, xaccel0, xomega, xr) {
		this.vxmax0 = vxmax0
		this.xaccel0 = xaccel0
		this.xomega = xomega
		this.xr = xr
	},
	start: function () {
		this.vx0 = 0
		this.x0 = null
		this.xtarget0 = null
		this.xtheta = 0
	},
	think: function (dt) {
		if (this.x0 === null) this.x0 = this.x
		if (this.xtarget0 !== null) {
			this.vx0 = Math.abs(this.vx0)
			this.vx0 = Math.min(this.vx0 + dt * this.xaccel0, this.vxmax0)
			let dx = Math.abs(this.xtarget0 - this.x0)
			let v = dx < 0.01 ? 100 : Math.min(this.vx0, Math.sqrt(2 * 2 * this.xaccel0 * dx) + 1)
			if (v * dt >= dx) {
				this.x0 = this.xtarget0
				this.xtarget0 = null
				this.vx0 = 0
			} else {
				this.vx0 = this.xtarget0 > this.x0 ? v : -v
				this.x0 += this.vx0 * dt
			}
		}
		this.xtheta += this.xomega * dt
		this.x = this.x0 + this.xr * Math.sin(this.xtheta)
		this.vx = this.vx0 + this.xr * this.xomega * Math.cos(this.xtheta)
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


const Cycloid = {
	think: function (dt) {
		let dy = this.dy0 + this.vy0 * this.t
		let yc = this.y0 + dy
		let dycdt = this.vy0
		let xc = this.x0
		let theta = Math.tau / 2 + dy / this.dydtheta
		let dthetadt = this.vy0 / this.dydtheta
		let S = Math.sin(theta), C = Math.cos(theta)
		this.x = xc + C * this.cr
		this.y = yc + S * this.cr
		this.vx = -S * dthetadt * this.cr
		this.vy = dycdt + C * dthetadt * this.cr
	},
}

const SinusoidsAcross = {
	start: function () {
		this.varc = 50
		this.harc = 50
		this.p0arc = 0
	},
	think: function (dt) {
		if (!this.alive || (this.target && !this.target.alive)) return
		let p = this.p0arc + this.varc * this.t
		let dpdt = this.varc
		let darc = Math.hypot(this.dxarc, this.dyarc)
		let beta = Math.tau * p / darc
		let dbetadt = Math.tau * dpdt / darc
		let h = this.harc * Math.sin(beta)
		let dhdt = this.harc * dbetadt * Math.cos(beta)
		let [C, S] = Math.norm([this.dxarc, this.dyarc])
		this.x = this.x0arc + p * C - h * S
		this.y = this.y0arc + p * S + h * C
		this.vx = dpdt * C - dhdt * S
		this.vy = dpdt * S + dhdt * C
	},
}

const CirclesRift = {
	start: function () {
		this.rrift = 300
		this.thetarift = 0
		this.think(0)
	},
	think: function (dt) {
		this.rrift = 1 + 300 * Math.exp(-0.03 * this.t)
		this.thetarift += 160 / this.rrift * dt
		this.x = this.rrift * Math.cos(this.thetarift) + 300
		this.y = this.rrift * Math.sin(this.thetarift) + 0
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
const EncirclesBoss = {
	init: function (faceout) {
		this.faceout = faceout
	},
	start: function () {
		this.vx = 0
		this.vy = 0
	},
	think: function (dt) {
		if (!this.alive || !this.target.alive) return
		this.theta += this.omega * dt
		let S = Math.sin(this.theta), C = Math.cos(this.theta)
		if (this.faceout) S *= -1
		this.x = this.target.x + this.R * C
		this.y = this.target.y + this.R * S
		this.vx = -S * this.R * this.omega
		this.vy = C * this.R * this.omega
			
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

const ShootsAtYou = {
	init: function (dtbullet) {
		this.dtbullet = dtbullet || 4
	},
	start: function () {
		this.tbullet = 0
		this.nbullet = 20
		this.vbullet = 150
		this.jbullet = 0
	},
	think: function (dt) {
		for (this.tbullet += dt ; this.tbullet >= this.dtbullet ; this.tbullet -= this.dtbullet, ++this.jbullet) {
			let [dx, dy] = Math.norm([state.you.x - this.x, state.you.y - this.y])
			let r = this.r + 2
			state.badbullets.push(new BadBullet({
				x: this.x + r * dx, y: this.y + r * dy,
				vx: this.vbullet * dx, vy: this.vbullet * dy,
			}))
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

const SpawnsHerons = {
	init: function (dtheron) {
		this.dtheron = dtheron
	},
	start: function () {
		this.theron = 0
		this.jheron = 0
	},
	think: function (dt) {
		for (this.theron += dt ; this.theron >= this.dtheron ; this.theron -= this.dtheron, ++this.jheron) {
			state.enemies.push(new Heron({ x: 600, y: this.y, vx: -60, vy: 0, target: this }))
		}
	},
}

const SpawnsSwallows = {
	init: function (nswallow) {
		this.nswallow = nswallow
	},
	start: function () {
		this.tshake = 0
		this.swallows = []
		for (let jswallow = 0 ; jswallow < this.nswallow ; ++jswallow) {
			let theta = jswallow * Math.tau / this.nswallow
			let swallow = new Swallow({ target: this, omega: 1, R: this.r, theta: theta })
			this.swallows.push(swallow)
			state.bosses.push(swallow)  // Was enemies
		}
	},
	think: function (dt) {
		if (this.tshake) {
			this.tshake = Math.max(this.tshake - dt, 0)
			if (this.tshake == 0) {
				this.xomega /= 3
				this.yomega /= 3
				if (!this.swallows.length) this.die()
			}
		} else if (this.swallows.some(s => !s.alive)) {
			this.tshake = 1.5
			this.xomega *= 5
			this.yomega *= 5
			this.swallows = this.swallows.filter(s => s.alive)
			this.swallows.forEach(s => s.omega *= 1.4)
		}
	},
}

const SpawnsCobras = {
	init: function (dtcobra) {
		this.dtcobra = dtcobra
	},
	start: function () {
		this.tcobra = 0
		this.jcobra = 0
	},
	think: function (dt) {
		for (this.tcobra += dt ; this.tcobra > this.dtcobra ; this.tcobra -= this.dtcobra) {
			this.spawncobra()
		}
	},
	spawncobra: function () {
		let x0 = 500 + (this.jcobra * Math.phi % 1) * 200
		let y0 = (this.jcobra * Math.phi % 1 * 2 - 1) * state.yrange
		let dx = -600, dy = (this.jcobra * Math.phi * Math.phi % 1 * 2 - 1) * 100
		let h = 80, p0 = 0, r = 40
		for (let jseg = 0 ; jseg < 12 ; ++jseg) {
			state.enemies.push(new Cobra({
				x0arc: x0, y0arc: y0, dxarc: dx, dyarc: dy,
				p0arc: p0, harc: h, r: r, target: this,
				diedelay: 0.5 + 0.2 * jseg,
			}))
			p0 -= r * 0.8
			r *= 0.95
		}
		this.jcobra += 1
	},
}

const SpawnsCanaries = {
	init: function (ncanary) {
		this.ncanary = this.ncanary || 6
	},
	start: function () {
		let dt0 = 0
		this.canaries = []
		for (let jcanary = 0 ; jcanary < this.ncanary ; ++jcanary) {
			let theta = jcanary * Math.tau / this.ncanary
			let omega = 1.5
			for (let r = 2 ; r < 5 ; ++r) {
				let canary = new Canary({ target: this, omega: omega, R: r * this.r, theta: theta, tbullet: dt0 * 4 })
				this.canaries.push(canary)
				state.enemies.push(canary)
				theta += Math.phi * Math.tau
				omega /= -1.5
			}
			dt0 = (dt0 + Math.phi) % 1
		}
	},
	think: function (dt) {
		if (this.canaries.some(s => !s.alive)) {
			this.yomega *= 1.2
			this.canaries = this.canaries.filter(s => s.alive)
			this.canaries.forEach(s => s.omega *= 1.1)
		}
	},
}

const SpawnsCapsule = {
	die: function () {
		state.planets.push(new Capsule({ x: this.x, y: this.y, vx: this.vx, vy: this.vy, name: "X", }))
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

function iflashcolor(iflash) {
	if (iflash <= 0) return null
	let a = Math.sqrt(iflash) * 12
	return [null, [1, 0.2, 0.2], null, [1, 0.7, 0.2]][Math.floor(a) % 4]
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

const DrawTumblingRock = {
	init: function (color0) {
		this.color0 = color0 || [1, 1, 1]
	},
	start: function () {
		this.iflash = 0
		this.rtheta = UFX.random()
		this.romega = UFX.random.choice([-1, 1]) * UFX.random(0.08, 0.25)
	},
	think: function (dt) {
		this.iflash = Math.max(this.iflash - dt, 0)
		this.rtheta += this.romega * dt
	},
	rockdata: function () {
		let scale = 0.01 * this.r * 0.39 * 4  // ???
		let color = iflashcolor(this.iflash) || this.color0
		return { x: this.x, y: this.y, r: this.r, T: this.rtheta % 1, color: color }
		
		// angle 50
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
function Turkey(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Turkey.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(HasHealth, 20)
	.addcomp(LetPickup, 3)
	.addcomp(Collides, 40)
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
function Lark(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
	this.think(0)
}
Lark.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(HasHealth, 4)
	.addcomp(LetPickup, 2)
	.addcomp(Collides, 20)
	.addcomp(Cycloid)
	.addcomp(DisappearsOffscreen, 1000)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(DrawFacingImage, "canary", 1.7)
	.addcomp(LeavesCorpse)

function Cobra(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Cobra.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(BossBound)
	.addcomp(SinusoidsAcross)
	.addcomp(Lives)
	.addcomp(DisappearsOffscreen, 800)
	.addcomp(InfiniteHealth)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(DrawFacingImage, "snake", 1.2, 0)
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

function Egret(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
	this.theta = 0
}
Egret.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(InfiniteHealth)
	.addcomp(Collides, 80)
	//.addcomp(RoundhouseBullets)
	.addcomp(SeeksHorizontalSinusoid, 30, 30, 0.8, 100)
	.addcomp(VerticalSinusoid, 0.6, 120)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(SpawnsSwallows, 6)
	.addcomp(SpawnsHerons, 3)
	.addcomp(SpawnsClusterBullets, 2)
	.addcomp(DrawAngleImage, "egret", 1.5)
	.addcomp(LeavesCorpse)
function Swallow(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Swallow.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(BossBound)
	.addcomp(EncirclesBoss, true)
	.addcomp(Lives)
	.addcomp(HasHealth, 20)
	.addcomp(Collides, 30)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(DrawAngleImage, "swallow", 1.3)
	.addcomp(LeavesCorpse)
function Medusa(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Medusa.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(HasHealth, 30) // was 16
	.addcomp(Collides, 60)
	.addcomp(RoundhouseBullets, 0.1)
	.addcomp(SeeksHorizontalPosition, 30, 30)
	.addcomp(VerticalSinusoid, 0.4, 120)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
//	.addcomp(SpawnsCobras)   How does this make sense???
	.addcomp(Tumbles, 1)
	.addcomp(DrawAngleImage, "medusa", 1.5)
	.addcomp(LeavesCorpse)
function Asp(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Asp.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(BossBound)
	.addcomp(EncirclesBoss)
	.addcomp(Lives)
	.addcomp(HasHealth, 10) // was 20
	.addcomp(Collides, 4)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(DrawFacingImage, "snake", 1.2, 0)
	.addcomp(LeavesCorpse)
function Hawk(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Hawk.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(HasHealth, 40)
	.addcomp(Collides, 60)
	.addcomp(RoundhouseBullets, 0.5)
	.addcomp(SeeksHorizontalPosition, 30, 30)
	.addcomp(VerticalSinusoid, 0.4, 100)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(SpawnsCobras, 15)
	.addcomp(SpawnsCanaries)
	.addcomp(SpawnsHerons, 8)
	.addcomp(SpawnsClusterBullets, 4)
	.addcomp(Tumbles, 0.5)
	.addcomp(DrawAngleImage, "hawk", 1.1)
	.addcomp(LeavesCorpse)
function Canary(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Canary.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(BossBound)
	.addcomp(EncirclesBoss)
	.addcomp(Lives)
	.addcomp(HasHealth, 20)
	.addcomp(Collides, 30)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(DrawFacingImage, "canary", 1.7)
	.addcomp(ShootsAtYou)
	.addcomp(LeavesCorpse)


function Rock(obj) {
	this.start()
	this.iflashmax = 0.3
	for (let s in obj) this[s] = obj[s]
}
Rock.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(LinearMotion)
	.addcomp(HasHealth, 3)
	.addcomp(LetPickup, 2)
	.addcomp(Collides, 20)
	.addcomp(DisappearsOffscreen)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(DrawTumblingRock)
	.addcomp(LeavesCorpse)
function BlueRock(obj) {
	this.start()
	this.iflashmax = 0.3
	for (let s in obj) this[s] = obj[s]
}
BlueRock.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(LinearMotion)
	.addcomp(HasHealth, 40)
	.addcomp(Collides, 20)
	.addcomp(DisappearsOffscreen)
	.addcomp(HurtsOnCollision, 2)
	.addcomp(KnocksOnCollision, 40)
	.addcomp(SpawnsCapsule)
	.addcomp(DrawTumblingRock, [0.8, 0.8, 1.0])
	.addcomp(LeavesCorpse)
function Gabriel(obj) {
	this.start()
	this.vx = -state.scrollspeed
	this.vy = 0
	this.name = "7"
	for (let s in obj) this[s] = obj[s]
}
Gabriel.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Collides, 50)
	.addcomp(LinearMotion)
	.addcomp(SeeksYou, 220)
	.addcomp(InfiniteHealth)
	.addcomp(DrawFacingImage, "gabriel", 0.6)
	.addcomp(Visitable, false)
function Him(obj) {
	this.start()
	for (let s in obj) this[s] = obj[s]
}
Him.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Lives)
	.addcomp(Collides, 5)
	.addcomp(CirclesRift)
	.addcomp(Tumbles, 1)
	.addcomp(DrawAngleImage, "cutter", 5)


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

