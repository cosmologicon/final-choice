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
	objs.forEach(obj => data = addpU(data, fvals(obj)))
	data.nvert = 6 * objs.length
	return data
}


let draw = {
	load: function () {
		UFX.resource.load({
			rocks: "data/rocks.png",
			sprites: "data/sprites.png",
		})
	},
	init: function () {
		this.pixelratio = window.devicePixelRatio || 1
		this.canvas = document.getElementById("canvas")
		gl = UFX.gl(canvas)
		if (!gl) {
			// TODO
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
			this.f = this.sV / (854 * 480)
		}
		UFX.maximize(canvas, { aspects: [settings.portrait ? 9/16 : 16/9], fillcolor: "#111" })
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
	},
	clear: function () {
		gl.clearColor(0, 0, 0, 1)
		gl.clear(gl.COLOR_BUFFER_BIT)
	},
	fill: function (color) {
		gl.progs.fill.use()
		gl.progs.fill.set({
			color: color,
		})
		pUbuffer.bind()
		gl.progs.fill.assignAttribOffsets({
			pU: 0,
		})
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
	},
	nebula: function (color1, color2) {
		gl.progs.nebula.use()
		gl.progs.nebula.set({
			screen: [this.wV, this.hV],
			T: Date.now() / 100000 % 1,
			color1: color1,
			color2: color2,
			y0: 0.00015 * state.y0,
		})
		pUbuffer.bind()
		gl.progs.nebula.assignAttribOffsets({
			pU: 0,
		})
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
	},
	_star: function (prog, sfactor, Tfactor) {
		prog.use()
		prog.set({
			screen: [this.wV, this.hV],
			T: Date.now() / (Tfactor * 1000) % 1,
			y0: 0.00025 * state.y0,
		})
		this.starbuffer.bind()
		prog.assignAttribOffsets({
			star: 0,
		})
		let n = Math.min(this.nstar, Math.floor(sfactor * this.wV * this.hV))
		gl.drawArrays(gl.POINTS, 0, n)
	},
	starfly: function () {
		this._star(gl.progs.starfly, 0.002, 100)
	},
	startalk: function () {
		this._star(gl.progs.startalk, 0.004, 300)
	},

	rocks: function (rockdata) {
		let data = builddata(rockdata, rock => [rock.x, rock.y, rock.r, rock.T, 1, 0, 0])
		if (!data.length) return
		gl.progs.rock.use()
		gl.progs.rock.set({
			screen: [this.wV, this.hV],
			texture: 2,
		})
		gl.makeArrayBuffer(data).bind()
		gl.progs.rock.assignAttribOffsets({
			pU: 0,
			center: 2,
			r: 4,
			T: 5,
			color: 6,
		})
		gl.drawArrays(gl.TRIANGLES, 0, data.nvert)
	},
	sprites: function (sdata) {
		let data = builddata(sdata, sprite => {
			let [tx, ty, tw, th] = Tdata[sprite.imgname]
			return [sprite.x, sprite.y, tx, ty, tw, th, sprite.scale, sprite.A, 1, 1, 1]
		})
		if (!data.length) return
		gl.progs.sprite.use()
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
	rock: {},
	sprite: {},
	bullet: {},
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

// Background nebula during the main gameplay
shaders.rock.vert = `
attribute vec2 pU;
attribute vec2 center;
attribute float r;
attribute float T;
attribute vec3 color;
uniform vec2 screen;
varying vec2 pT0, pT1;
varying float aT;
varying vec3 tcolor;
void main() {
	vec2 p = (pU * r + center) / screen;
	pT0 = -pU * 0.5 + 0.5;
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
	if (screen.x > screen.y) pT0.xy = pT0.yx;
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
attribute vec3 color;
uniform vec2 screensizeV;
uniform float y0G;  // Game coordinate at the halfway point (vertical in landscape)
varying vec3 tcolor;
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
varying vec3 tcolor;
varying vec2 pT;
void main() {
	float alpha = length(pT) < 1.0 ? 1.0 : 0.0;
	gl_FragColor = vec4(tcolor, alpha);
}
`


