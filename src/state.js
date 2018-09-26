"use strict"

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
	
	scrollspeed: 40,
	yrange: 320,

	init: function () {
		this.you = null
		this.clear()
		this.restart()
		this.y0 = 0
	},
	clear: function () {
		this.yous = []
		this.goodbullets = []
	},
	restart: function () {
		this.twin = 0
		this.tlose = 0
		this.tslow = 0
		this.tinvulnerable = 0
		this.xoffset = 0
	},
	think: function (dt) {
		let objs = this.yous
		objs.forEach(obj => obj.think(dt))

		let ymax = this.yrange - this.you.r
		let y0max = this.yrange - 240
		let a = y0max / (2 * Math.pow(ymax, 3))
		let b = 3 * Math.pow(ymax, 2) * a
		this.y0 = b * this.you.y - a * Math.pow(this.you.y, 3)
	},
	
	draw: function () {
		let sprites = this.yous
		draw.sprites(sprites.map(sprite => sprite.spritedata()))
	},
}
state.init()

