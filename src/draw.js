// Shaders

// Coordinate convention:
// In portrait mode: +x is up, +y is right
// In landscape mode: +x is right, +y is down
// angle > 0 is clockwise


// Dedicated textures:
// 0: UFX.gltext
// 1: nebula
// 2: rocks
// 3: sprites
// 4: avatars (swap out)
// 5: help

"use strict"

let gl, pUbuffer

// Add the given values to the data array 6x, along with corresponding pU's.
function addpU(data, vals) {
	return data.concat(
		[-1, -1], vals, [1, -1], vals, [1, 1], vals,
		[-1, -1], vals, [1, 1], vals, [-1, 1], vals
	)
}
function builddata(objs, fvals) {
	let data = []
	objs.forEach((obj, j) => data = addpU(data, fvals(obj, j)))
	data.nvert = 6 * objs.length
	return data
}

function T(x) {
	if (arguments.length > 1) {
		return Array.from(arguments).map(arg => T(arg))
	}
	if (x.length > 1) {
		return x.map(arg => T(arg))
	}
	return x > 0 ? Math.ceil(draw.f * x) : Math.floor(draw.f * x)
}
function yswap(a) {
	if (a.length == 2) return [a[0], draw.hV - a[1]]
	return [a[0], draw.hV - a[1] - a[3], a[2], a[3]]
}
let draw = {
	load: function () {
		UFX.resource.load({
			rocks: "data/rocks.png",
			sprites: "data/sprites.png",
			help: "data/help.png",
		})
		;"1234567ACJX".split("").forEach(a => {
			UFX.resource.load([["bio-" + a, "data/biopix/bio-" + a + ".jpg"]])
		})
		UFX.resource.loadwebfonts("Bungee", "Fjalla One", "Lalezar", "Londrina Solid", "Passion One", "Permanent Marker")
		UFX.gltext.DEFAULT.lineheight = 1.2

		this.pixelratio = window.devicePixelRatio || 1
		this.canvas = document.getElementById("canvas")
		gl = UFX.gl(canvas)
		if (!gl) {
			window.alert("WebGL browser support required. See http://get.webgl.org")
			return
		}
		UFX.gltext.init(gl)
		canvas.style.background = "black"
		pUbuffer = gl.makeArrayBuffer([-1, -1, 1, -1, 1, 1, -1, 1])
		for (let name in shaders) {
			gl.addProgram(name, shaders[name].vert, shaders[name].frag)
		}
		setTimeout((() => window.scrollTo(0, 1)), 1)
		UFX.maximize.onadjust = (canvas, w, h, aspect) => {
			this.wV = canvas.width = w * this.pixelratio
			this.hV = canvas.height = h * this.pixelratio
			canvas.style.width = w + "px"
			canvas.style.height = h + "px"
			this.sV = Math.sqrt(this.wV * this.hV)
			gl.viewport(0, 0, this.wV, this.hV)
			this.aspect = aspect
			this.f = this.sV / Math.sqrt(854 * 480)
		}
		this.setaspect()
		gl.disable(gl.DEPTH_TEST)
		gl.enable(gl.BLEND)
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, 0, 1)

		this.nstar = 10000
		let stardata = []
		for (let j = 0 ; j < this.nstar ; ++j) {
			let z = UFX.random.rand(4, 16)
			stardata.push(UFX.random(), UFX.random(), z)
		}
		this.starbuffer = gl.makeArrayBuffer(stardata)

		let data = []
		while (data.length < 64 * 64 * 3) data.push(UFX.random.rand(0, 255))
		this.nebulatexture = gl.buildTexture({
			pixels: Uint8Array.from(data),
			size: 64,
			format: gl.RGB,
			mipmap: false,
			filter: gl.LINEAR,
		})
		gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, this.nebulatexture)

		// Fullscreen polyfill
		canvas.requestFullscreen = canvas.requestFullscreen
			|| canvas.mozRequestFullScreen
			|| canvas.webkitRequestFullScreen
		document.exitFullscreen = document.exitFullscreen
			|| document.webkitExitFullscreen
			|| document.mozCancelFullScreen
			|| document.msExitFullscreen
		window.addEventListener("mozfullscreenchange", UFX.maximize.onfullscreenchange)
		window.addEventListener("webkitfullscreenchange", UFX.maximize.onfullscreenchange)
		UFX.maximize.getfullscreenelement = (() => document.fullscreenElement
			|| document.mozFullScreenElement
			|| document.webkitFullscreenElement
			|| document.msFullscreenElement)
	},
	// Call after changing settings.portrait
	setaspect: function () {
		UFX.maximize(canvas, { aspects: [settings.portrait ? 9/16 : 16/9], fillcolor: "#111" })
	},
	// Call after UFX.resource finishes loading
	init: function () {
		this.rocktexture = gl.buildTexture({
			source: UFX.resource.images.rocks,
			min_filter: gl.LINEAR_MIPMAP_NEAREST,
		})
		gl.activeTexture(gl.TEXTURE2)
		gl.bindTexture(gl.TEXTURE_2D, this.rocktexture)

		this.spritetexture = gl.buildTexture({
			source: UFX.resource.images.sprites,
			min_filter: gl.LINEAR_MIPMAP_NEAREST,
		})
		gl.activeTexture(gl.TEXTURE3)
		gl.bindTexture(gl.TEXTURE_2D, this.spritetexture)

		this.biotextures = {}
		;"1234567ACJX".split("").forEach(a => {
			this.biotextures[a] = gl.buildTexture({
				source: UFX.resource.images["bio-" + a],
				min_filter: gl.LINEAR_MIPMAP_NEAREST,
				flip: true,
				wrap: gl.CLAMP_TO_EDGE,
			})
		})

		this.helptexture = gl.buildTexture({
			source: UFX.resource.images.help,
			min_filter: gl.LINEAR_MIPMAP_NEAREST,
			flip: true,
		})
		gl.activeTexture(gl.TEXTURE5)
		gl.bindTexture(gl.TEXTURE_2D, this.helptexture)
	},
	screenpos: function (pG) {
		let [xG, yG] = pG
		let xV = this.f * (xG + 427), yV = this.f * (240 - (yG - state.y0))
		return settings.portrait ? [this.wV - yV, xV] : [xV, yV]
	},
	clear: function () {
		gl.clearColor(0, 0, 0, 1)
		gl.clear(gl.COLOR_BUFFER_BIT)
	},
	fill: function (color, crop) {
		if (color.length == 3) color = color.concat([1])
		if (crop) {
			gl.scissor.apply(gl, crop)
			gl.enable(gl.SCISSOR_TEST)
		}
		gl.progs.fill.use()
		gl.progs.fill.set({
			color: color,
		})
		pUbuffer.bind()
		gl.progs.fill.assignAttribOffsets({
			pU: 0,
		})
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
		if (crop) gl.disable(gl.SCISSOR_TEST)
	},
	nebula: function (color1, color2, Tfactor) {
		if (Tfactor === undefined) Tfactor = 100
		gl.progs.nebula.use()
		gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, this.nebulatexture)
		gl.progs.nebula.set({
			screen: [this.wV, this.hV],
			T: Date.now() / (Tfactor * 1000) % 1,
			color1: color1,
			color2: color2,
			y0: 0.00015 * state.y0,
			texture: 1,
		})
		pUbuffer.bind()
		gl.progs.nebula.assignAttribOffsets({
			pU: 0,
		})
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
	},
	rift: function () {
		gl.progs.rift.use()
		gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, this.nebulatexture)
		gl.progs.rift.set({
			screen: [this.wV, this.hV],
			T: Date.now() / -10000 % 1,
			color1: [0.5, 1, 0.5],
			color2: [1, 1, 1],
			y0: state.y0,
			texture: 1,
		})
		pUbuffer.bind()
		gl.progs.rift.assignAttribOffsets({
			pU: 0,
		})
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
	},
	_star: function (prog, sfactor, Tfactor) {
		prog.use()
		prog.set({
			screen: [this.wV, this.hV],
			T: Tfactor ? Date.now() / (Tfactor * 1000) % 1 : 0,
		})
		if (prog.set.y0) prog.set.y0(0.00025 * state.y0)
		this.starbuffer.bind()
		prog.assignAttribOffsets({
			star: 0,
		})
		let n = Math.min(this.nstar, Math.floor(sfactor * this.wV * this.hV))
		gl.drawArrays(gl.POINTS, 0, n)
	},
	starfly: function (Tfactor) {
		if (Tfactor === undefined) Tfactor = 100
		this._star(gl.progs.starfly, 0.002, Tfactor)
	},
	startalk: function () {
		this._star(gl.progs.startalk, 0.004, 300)
	},

	rocks: function (rockdata) {
		let data = builddata(rockdata, rock => [rock.x, rock.y, rock.r, rock.T].concat(rock.color))
		if (!data.length) return
		gl.progs.rock.use()
		gl.activeTexture(gl.TEXTURE2)
		gl.bindTexture(gl.TEXTURE_2D, this.rocktexture)
		gl.progs.rock.set({
			screensizeV: [this.wV, this.hV],
			texture: 2,
			y0G: state.y0,
		})
		gl.makeArrayBuffer(data).bind()
		gl.progs.rock.assignAttribOffsets({
			pU: 0,
			pG0: 2,
			GscaleU: 4,
			T: 5,
			color: 6,
		})
		gl.drawArrays(gl.TRIANGLES, 0, data.nvert)
	},
	sprites: function (sdata) {
		let data = builddata(sdata, sprite => {
			let [tx, ty, tw, th] = Tdata[sprite.imgname]
			let color = sprite.color || [1, 1, 1]
			return [sprite.x, sprite.y, tx, ty, tw, th, sprite.scale, sprite.A].concat(color)
		})
		if (!data.length) return
		gl.progs.sprite.use()
		gl.activeTexture(gl.TEXTURE3)
		gl.bindTexture(gl.TEXTURE_2D, this.spritetexture)
		gl.progs.sprite.set({
			screensizeV: [this.wV, this.hV],
			texture: 3,
			y0G: state.y0,
		})
		gl.makeArrayBuffer(data).bind()
		gl.progs.sprite.assignAttribOffsets({
			pU: 0,
			pG0: 2,
			pT0: 4,
			TscaleU: 6,
			scale: 8,
			A: 9,
			color: 10,
		})
		gl.drawArrays(gl.TRIANGLES, 0, data.nvert)
	},
	hitbox: function (objs) {
		let data = builddata(objs, obj => {
			return [obj.x, obj.y, obj.r]
		})
		if (!data.length) return
		gl.progs.hitbox.use()
		gl.progs.hitbox.set({
			screensizeV: [this.wV, this.hV],
			y0G: state.y0,
			color: [1, 1, 0.7],
		})
		gl.makeArrayBuffer(data).bind()
		gl.progs.hitbox.assignAttribOffsets({
			pU: 0,
			pG0: 2,
			GscaleU: 4,
		})
		gl.drawArrays(gl.TRIANGLES, 0, data.nvert)
	},

	health: function (imgnames) {
		let [x0, y0] = settings.portrait ? [402, -220] : [-407, -215]
		let [dx, dy] = settings.portrait ? [0, 20] : [20, 0]
		let A = settings.portrait ? Math.tau / 4 : 0
		let data = builddata(imgnames, (imgname, j) => {
			let [tx, ty, tw, th] = Tdata[imgname]
			return [x0 + dx * j, y0 + dy * j, tx, ty, tw, th, 0.3, A, 1, 1, 1]
		})
		if (!data.length) return
		gl.progs.sprite.use()
		gl.activeTexture(gl.TEXTURE3)
		gl.bindTexture(gl.TEXTURE_2D, this.spritetexture)
		gl.progs.sprite.set({
			screensizeV: [this.wV, this.hV],
			texture: 3,
			y0G: 0,
		})
		gl.makeArrayBuffer(data).bind()
		gl.progs.sprite.assignAttribOffsets({
			pU: 0,
			pG0: 2,
			pT0: 4,
			TscaleU: 6,
			scale: 8,
			A: 9,
			color: 10,
		})
		gl.drawArrays(gl.TRIANGLES, 0, data.nvert)
	},
	bullets: function (bdata) {
		let data = builddata(bdata, bullet => {
			return [bullet.x, bullet.y, bullet.r].concat(bullet.color)
		})
		if (!data.length) return
		gl.progs.bullet.use()
		gl.progs.bullet.set({
			screensizeV: [this.wV, this.hV],
			y0G: state.y0,
		})
		gl.makeArrayBuffer(data).bind()
		gl.progs.bullet.assignAttribOffsets({
			pU: 0,
			pG0: 2,
			GscaleU: 4,
			color: 5,
		})
		gl.drawArrays(gl.TRIANGLES, 0, data.nvert)
	},
	avatartext: {
		"1": "Dr. Danilowka",
		"2": "Chf. Paulson",
		"3": "Lt. Jusuf",
		"4": "Dr. Osaretin",
		"5": "Mr. Tannenbaum",
		"6": "Cmdr. Cooper",
		"X": "Mr. Graves",
		"J": "Prof. Jyn",
		"C": "Gen. Cutter",
		"7": "Capt. Gabriel",
		"A": "Capt. Alyx",
	},
	avatar: function (name, pos, s, a, showtitle) {
		a = Math.clamp(a, 0, 1)
		if (a == 0) return
		gl.progs.bio.use()
		gl.activeTexture(gl.TEXTURE4)
		gl.bindTexture(gl.TEXTURE_2D, this.biotextures[name])
		gl.progs.bio.set({
			centerV: pos,
			screensizeV: [this.wV, this.hV],
			sV: s,
			a: a,
			texture: 4,
			T: Date.now() / 1400 % 1,
			ocolor: [0.4, 0.4, 1],
		})
		pUbuffer.bind()
		gl.progs.bio.assignAttribOffsets({
			pU: 0,
		})
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
		if (showtitle && a == 1) {
			gl.progs.text.use()
			UFX.gltext(this.avatartext[name], {
				centerx: pos[0],
				bottom: pos[1] - 0.5 * s,
				owidth: 2,
				ocolor: "black",
				fontname: "Lalezar",
				fontsize: T(12),  // TODO: make larger?
			})
		}
	},
	help: function () {
		let centerV = settings.portrait ? [this.wV / 2, this.hV * 0.25] : [this.wV * 0.35, this.hV / 2]
		let VscaleU = settings.portrait ? this.wV / 2 : this.wV * 0.35
		gl.progs.help.use()
		gl.activeTexture(gl.TEXTURE5)
		gl.bindTexture(gl.TEXTURE_2D, this.helptexture)
		gl.progs.help.set({
			centerV: centerV,
			screensizeV: [this.wV, this.hV],
			VscaleU: VscaleU,
			texture: 5,
		})
		pUbuffer.bind()
		gl.progs.help.assignAttribOffsets({
			pU: 0,
		})
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
	},
	
	// The next key press will result in fullscreen being requested.
	readyfullscreen: function () {
		document.addEventListener("keyup", draw.reqfs, { passive: false })
	},
	unreadyfullscreen: function () {
		document.removeEventListener("keyup", draw.reqfs)
		if (UFX.scene.top() === UFX.scenes.gofull) UFX.scene.pop()
	},
	reqfs: function (event) {
		draw.unreadyfullscreen()
		UFX.maximize.setoptions({ fullscreen: true })
	},
}

// UFX.scene.push("gofull") will pause and give the player 5 seconds to confirm going fullscreen.
UFX.scenes.gofull = {
	start: function () {
		let isfull = UFX.maximize.getfullscreenelement() === canvas
		if (!settings.fullscreen) {
			UFX.maximize.setoptions({ fullscreen: false })
			document.exitFullscreen()
			UFX.scene.pop()
			return
		}
		if (isfull && settings.fullscreen) {
			UFX.scene.pop()
			return
		}
		draw.readyfullscreen()
		this.t = 0
		this.paused = false
	},
	think: function (dt) {
		this.t += dt
		if (!this.paused && this.t > 0.4) {
			this.paused = true
		}
		if (this.t > 5) draw.unreadyfullscreen()
	},
	draw: function () {
		if (!this.paused) return
		gl.clearColor(0.3, 0.3, 0.3, 1)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.progs.text.use()
		let text = "Press Space\nto enter\nfullscreen"
		gl.progs.text.draw(text, {
			centerx: draw.wV / 2,
			centery: draw.hV / 2,
			color: "white",
			ocolor: "black",
			fontname: "Bungee",
			fontsize: 0.1 * draw.sV,
		})
	},
}


// Position and size of the sprite within the texture sheet
const Tdata = {
	"rift-1": [0.146484375, 0.146484375, 0.146484375, 0.146484375],
	"rift-2": [0.443359375, 0.146484375, 0.146484375, 0.146484375],
	"rift-0": [0.740234375, 0.146484375, 0.146484375, 0.146484375],
	"health0": [0.93359375, 0.07177734375, 0.04296875, 0.07177734375],
	"rift-3": [0.146484375, 0.443359375, 0.146484375, 0.146484375],
	"hawk": [0.40087890625, 0.40087890625, 0.10400390625, 0.10400390625],
	"you": [0.64306640625, 0.37451171875, 0.13427734375, 0.07763671875],
	"gabriel": [0.88037109375, 0.38623046875, 0.09912109375, 0.08935546875],
	"heron": [0.08642578125, 0.681640625, 0.08642578125, 0.087890625],
	"medusa": [0.26171875, 0.67333984375, 0.0849609375, 0.07958984375],
	"cutter": [0.44970703125, 0.65771484375, 0.09912109375, 0.06396484375],
	"egret": [0.6240234375, 0.6650390625, 0.0712890625, 0.0712890625],
	"swallow": [0.77001953125, 0.6640625, 0.07080078125, 0.0703125],
	"snake": [0.9111328125, 0.6611328125, 0.06640625, 0.0673828125],
	"duck": [0.05712890625, 0.83837890625, 0.05712890625, 0.06494140625],
	"shield": [0.1611328125, 0.84521484375, 0.04296875, 0.07177734375],
	"health": [0.2509765625, 0.84521484375, 0.04296875, 0.07177734375],
	"canary": [0.35693359375, 0.8251953125, 0.05908203125, 0.0517578125],
	"canay": [0.47900390625, 0.8251953125, 0.05908203125, 0.0517578125],
	"capsule": [0.60205078125, 0.822265625, 0.06005859375, 0.048828125],
	"zap": [0.7158203125, 0.8232421875, 0.0498046875, 0.0498046875],
	"mpickup": [0.8173828125, 0.82373046875, 0.0478515625, 0.05029296875],
	"R": [0.931640625, 0.8046875, 0.0625, 0.03125],
	"missile": [0.044921875, 0.94140625, 0.044921875, 0.0205078125],
}


const shaders = {
	fill: {},
	startalk: {},
	starfly: {},
	nebula: {},
	rift: {},
	rock: {},
	sprite: {},
	hitbox: {},
	bullet: {},
	bio: {},
	help: {},
}

shaders.fill.vert = `
attribute vec2 pU;
void main() {
	gl_Position = vec4(pU, 0.0, 1.0);
}
`
shaders.fill.frag = `
precision highp float;
uniform vec4 color;
void main() {
	gl_FragColor = color;
}
`

// Stars during the main gameplay, moving across the screen.
shaders.starfly.vert = `
attribute vec3 star;
uniform float T;   // Range [0, 1)
uniform vec2 screen;  // screen size in pixels
uniform float y0;
varying float c;
void main() {
	vec2 pos = mod(star.xy - star.z * vec2(y0, T), 1.0) * 2.0 - 1.0;
	if (screen.x > screen.y) pos.xy = vec2(pos.y, -pos.x);
	gl_Position = vec4(pos, 0.0, 1.0);
	c = star.z / 15.0;
}
`
shaders.starfly.frag = `
precision highp float;
varying float c;
void main() {
	vec3 color = vec3(c);
	gl_FragColor = vec4(color, 1.0);
}
`

// Stars during visits and various menu scenes, radiating outward from the center.
shaders.startalk.vert = `
attribute vec3 star;
uniform float T;   // Range [0, 1)
uniform vec2 screen;  // screen size in pixels
varying float c;
void main() {
	float s = length(screen);
	float r = mod(T * star.z + 1000.0 * star.x, 1.0);
	// r = pow(r, 3.0);
	c = clamp(1.6 * r * star.z / 15.0, 0.0, 1.0);
	vec2 pos = normalize(star.xy * 2.0 - 1.0) * r;
	pos = s * (pos / screen);
	gl_Position = vec4(pos, 0.0, 1.0);
}
`
shaders.startalk.frag = `
precision highp float;
varying float c;
void main() {
	vec3 color = vec3(c);
	gl_FragColor = vec4(color, 1.0);
}
`

// Background nebula during the main gameplay
shaders.nebula.vert = `
attribute vec2 pU;
uniform vec2 screen;
uniform float T;
uniform float y0;
varying vec2 pT;
void main() {
	pT = pU * 0.05;
	pT.y *= 16.0 / 9.0;
	pT += vec2(y0, T);
	vec2 p = pU;
	if (screen.x > screen.y) p = vec2(p.y, -p.x);
	gl_Position = vec4(p, 0.0, 1.0);
}
`
shaders.nebula.frag = `
precision highp float;
uniform sampler2D texture;
uniform vec3 color1, color2;
varying vec2 pT;
void main() {
	float f = 0.4;
	float a = texture2D(texture, 21.0 * pT).r;
	a = mix(a, texture2D(texture, 13.0 * pT).g, f);
	a = mix(a, texture2D(texture, 8.0 * pT).b, f);
	a = mix(a, texture2D(texture, 5.0 * pT + 0.4).r, f);
	a = mix(a, texture2D(texture, 3.0 * pT + 0.4).g, f);
	a = mix(a, texture2D(texture, 1.0 * pT + 0.4).b, f);
	vec3 color = mix(color1, color2, a);
	gl_FragColor = vec4(a * color, 1.0);
}
`
shaders.rift.vert = `
attribute vec2 pU;
uniform vec2 screen;
uniform float T;
uniform float y0;
varying vec2 pA;
varying float dT;
void main() {
	pA = pU * 0.05;
	pA.x += y0 / 480.0 * 0.1;
	pA.y -= 300.0 / 854.0 * 0.1;
	pA.y *= 16.0 / 9.0;
	dT = T;
	vec2 p = pU;
	if (screen.x > screen.y) p = vec2(p.y, -p.x);
	gl_Position = vec4(p, 0.0, 1.0);
}
`
shaders.rift.frag = `
precision highp float;
uniform sampler2D texture;
uniform vec3 color1, color2;
varying vec2 pA;
varying float dT;
const float tau = 6.283185307179586;
void main() {
	vec2 pT = vec2(sqrt(distance(pA, vec2(0.0))), atan(pA.x, pA.y) / tau);
	float f = 0.4;
	float a = texture2D(texture, 21.0 * pT).r;
	a = mix(a, texture2D(texture, 13.0 * pT).g, f);
	a = mix(a, texture2D(texture, 8.0 * pT).b, f);
	a = mix(a, texture2D(texture, 5.0 * pT + vec2(-5.0, -2.0) * dT).r, f);
	a = mix(a, texture2D(texture, 3.0 * pT + vec2(-6.0, -2.0) * dT).g, f);
	a = mix(a, texture2D(texture, 1.0 * pT + vec2(1.0, 1.0) * dT).b, f);
	a += 1.0 - pT.x * 8.0;
	vec3 color = mix(color1, color2, a);
	gl_FragColor = vec4(color, a);
}
`



shaders.rock.vert = `
attribute vec2 pU;  // Unit coordinates
attribute vec2 pG0;  // Position in game coordinates
attribute float GscaleU;
attribute float T;
attribute vec3 color;
uniform vec2 screensizeV;
uniform float y0G;  // Game coordinate at the halfway point (vertical in landscape)
varying vec2 pT0, pT1;
varying float aT;
varying vec3 tcolor;

const vec2 PscaleG = vec2(1.0 / 427.0, 1.0 / 240.0);
const float A = -2.6;
const mat2 R = mat2(cos(A), -sin(A), sin(A), cos(A));
void main() {
	// Landscape mode by default
	vec2 pG = pG0 + R * (GscaleU * pU);
	// This combines two transforms. First apply the y0 offset. Second, account for the fact that
	// +yG is down while +yP is up.
	pG.y = y0G - pG.y;
	vec2 pP = PscaleG * pG;
	// Transform to portrait mode
	if (screensizeV.y > screensizeV.x) {
		pP = vec2(-pP.y, pP.x);
	}
	gl_Position = vec4(pP, 0.0, 1.0);

	pT0 = -pU * 0.5 + 0.5;
//	if (screen.x > screen.y) pT0.xy = pT0.yx;
	float a = mod(T * 60.0, 60.0);
	aT = fract(a);
	a = floor(a);
	pT1 = pT0;
	pT0.x += mod(a, 8.0);
	pT0.y += floor(a / 8.0);
	pT0 /= 8.0;
	pT1.x += mod(a + 1.0, 8.0);
	pT1.y += floor((a + 1.0) / 8.0);
	pT1 /= 8.0;
	tcolor = color;
}
`
shaders.rock.frag = `
precision highp float;
uniform sampler2D texture;
varying vec2 pT0, pT1;
varying float aT;
varying vec3 tcolor;
void main() {
	gl_FragColor = mix(texture2D(texture, pT0), texture2D(texture, pT1), aT);
	gl_FragColor.rgb *= tcolor;
}
`

shaders.sprite.vert = `
attribute vec2 pU;  // Unit coordinates
attribute vec2 pG0;  // Position in game coordinates
attribute vec2 pT0, TscaleU;   // Center and offset of texture coordinates
attribute float scale;   // Unitless scale of sprite on screen
attribute float A;  // Clockwise rotation
attribute vec3 color;
uniform vec2 screensizeV;
uniform float y0G;  // Game coordinate at the halfway point (vertical in landscape)
varying vec2 pT;
varying vec3 tcolor;
mat2 R(float theta) {
	float s = sin(theta), c = cos(theta);
	return mat2(c, s, -s, c);
}

const vec2 PscaleG = vec2(1.0 / 427.0, 1.0 / 240.0);
const float GscaleT = 1024.0;

void main() {
	pT = pT0 + TscaleU * pU;
	// Landscape mode by default
	vec2 pG = pG0 + R(A) * (scale * GscaleT * TscaleU * pU);
	// This combines two transforms. First apply the y0 offset. Second, account for the fact that
	// +yG is down while +yP is up.
	pG.y = y0G - pG.y;
	vec2 pP = PscaleG * pG;
	// Transform to portrait mode
	if (screensizeV.y > screensizeV.x) {
		pP = vec2(-pP.y, pP.x);
	}
	gl_Position = vec4(pP, 0.0, 1.0);
	tcolor = color;
}
`
shaders.sprite.frag = `
precision highp float;
uniform sampler2D texture;
varying vec2 pT;
varying vec3 tcolor;
void main() {
	gl_FragColor = texture2D(texture, pT);
	gl_FragColor.rgb *= tcolor;
}
`

shaders.bullet.vert = `
attribute vec2 pU;  // Unit coordinates
attribute vec2 pG0;  // Position in game coordinates
attribute float GscaleU;  // bullet radius
attribute vec4 color;
uniform vec2 screensizeV;
uniform float y0G;  // Game coordinate at the halfway point (vertical in landscape)
varying vec4 tcolor;
varying vec2 pT;
const vec2 PscaleG = vec2(1.0 / 427.0, 1.0 / 240.0);
void main() {
	// Landscape mode by default
	vec2 pG = pG0 + GscaleU * pU;
	// This combines two transforms. First apply the y0 offset. Second, account for the fact that
	// +yG is down while +yP is up.
	pG.y = y0G - pG.y;
	vec2 pP = PscaleG * pG;
	// Transform to portrait mode
	if (screensizeV.y > screensizeV.x) {
		pP = vec2(-pP.y, pP.x);
	}
	gl_Position = vec4(pP, 0.0, 1.0);
	tcolor = color;
	pT = pU;
}
`
shaders.bullet.frag = `
precision highp float;
varying vec4 tcolor;
varying vec2 pT;
void main() {
	float alpha = length(pT) < 1.0 ? 1.0 : 0.0;
	gl_FragColor = tcolor;
	gl_FragColor.a *= alpha;
}
`

// Character avatar
shaders.bio.vert = `
attribute vec2 pU;
uniform vec2 centerV;
uniform vec2 screensizeV;
uniform float sV;
uniform float a;
varying vec2 pT;
varying vec2 rV, dpV;
varying float owV;
void main() {
	// Half-dimensions of the avatar image or static rectangle
	vec2 r0V = clamp((3.0 * a + vec2(1.0, 0.0)) * sV, 1.0, sV) / 2.0;
	// Image margin
	float dV = 0.03 * sV;
	// Half-dimensions of the outline rectangle
	rV = r0V + dV;
	dpV = rV * pU;
	pT = (dpV / r0V) * 0.5 + 0.5;
	vec2 pV = centerV + dpV;
	vec2 pP = pV / screensizeV * 2.0 - 1.0;
	gl_Position = vec4(pP, 0.0, 1.0);
	owV = ceil(sV / 100.0);
}
`
shaders.bio.frag = `
precision highp float;
uniform float a;
uniform sampler2D texture;
uniform vec3 ocolor;
varying float owV;
varying vec2 pT;
varying vec2 rV, dpV;
uniform float T;
void main() {
	if (any(greaterThan(abs(dpV) - rV, vec2(-owV)))) {
 		float c = 0.8 + 0.2 * sin(6.283 * T);
		gl_FragColor = vec4(ocolor * c, 1.0);
	} else if (all(lessThan(vec2(0.0), pT)) && all(lessThan(pT, vec2(1.0)))) {
	 	if (a < 1.0) {
			gl_FragColor = vec4(0.4, 0.4, 0.4, 1.0);
		} else {
			gl_FragColor = texture2D(texture, pT);
		}
	} else {
		discard;
	}
}
`

// Help graphic
shaders.help.vert = `
attribute vec2 pU;
uniform vec2 centerV;
uniform vec2 screensizeV;
uniform float VscaleU;
varying vec2 pT;
void main() {
	vec2 pV = centerV + VscaleU * pU;
	vec2 pP = pV / screensizeV * 2.0 - 1.0;
	gl_Position = vec4(pP, 0.0, 1.0);
	pT = pU * 0.5 + 0.5;
}
`
shaders.help.frag = `
precision highp float;
uniform sampler2D texture;
varying vec2 pT;
void main() {
	gl_FragColor = texture2D(texture, pT);
}
`

shaders.hitbox.vert = `
attribute vec2 pU;
attribute vec2 pG0;
attribute float GscaleU;
uniform vec2 screensizeV;
uniform float y0G;

const vec2 PscaleG = vec2(1.0 / 427.0, 1.0 / 240.0);
varying vec2 pT;
varying float aT;
void main() {
	vec2 pG = pG0 + GscaleU * pU;
	pG.y = y0G - pG.y;
	vec2 pP = PscaleG * pG;
	if (screensizeV.y > screensizeV.x) {
		pP = vec2(-pP.y, pP.x);
	}
	gl_Position = vec4(pP, 0.0, 1.0);
	pT = pU;
	aT = GscaleU;
}
`
shaders.hitbox.frag = `
precision highp float;
uniform vec3 color;
varying vec2 pT;
varying float aT;
void main() {
	float r = length(pT);
	if (r > 1.0 || 1.0 - r > 0.8 / aT) discard;
	gl_FragColor = vec4(color, 1.0);
}
`

