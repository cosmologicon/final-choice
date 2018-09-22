// Shaders


// Dedicated textures:
// 0: UFX.gltext
// 1: nebula
// 2: rocks

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
		UFX.resource.load({ rocks: "data/rocks.png" })
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
		this.portrait = true
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
		}
		UFX.maximize(canvas, { aspects: [this.portrait ? 9/16 : 16/9], fillcolor: "black" })
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
		})
		gl.activeTexture(gl.TEXTURE2)
		gl.bindTexture(gl.TEXTURE_2D, this.rocktexture)
	},
	clear: function () {
		gl.clearColor(0, 0, 0, 1)
		gl.clear(gl.COLOR_BUFFER_BIT)
	},
	nebula: function (color1, color2) {
		gl.progs.nebula.use()
		gl.progs.nebula.set({
			screen: [this.wV, this.hV],
			T: Date.now() / 100000 % 1,
			color1: color1,
			color2: color2,
		})
		pUbuffer.bind()
		gl.progs.nebula.assignAttribOffsets({
			pU: 0,
		})
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
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

	_star: function (prog, sfactor, Tfactor) {
		prog.use()
		prog.set({
			screen: [this.wV, this.hV],
			T: Date.now() / (Tfactor * 1000) % 1,
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
}


const shaders = {
	startalk: {},
	starfly: {},
	nebula: {},
	rock: {},
}

// Stars during the main gameplay, moving across the screen.
shaders.starfly.vert = `
attribute vec3 star;
uniform float T;   // Range [0, 1)
uniform vec2 screen;  // screen size in pixels
varying float c;
void main() {
	vec2 pos = vec2(star.x, mod(star.y - star.z * T, 1.0)) * 2.0 - 1.0;
	if (screen.x > screen.y) pos.xy = pos.yx;
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
varying vec2 pT;
void main() {
	pT = pU * 0.05;
	pT.y *= 16.0 / 9.0;
	pT.y += T;
	gl_Position = vec4(pU, 0.0, 1.0);
	if (screen.x > screen.y) pT.xy = pT.yx;
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
varying vec2 pT;
varying vec3 tcolor;
void main() {
	vec2 p = (pU * r + center) / screen;
	pT = -pU * 0.5 + 0.5;
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
//	if (screen.x > screen.y) pT.xy = pT.yx;
	float a = mod(T * 60.0, 60.0);
	a = floor(a);
	pT.x += mod(a, 8.0);
	pT.y += floor(a / 8.0);
	pT /= 8.0;
	tcolor = color;
}
`
shaders.rock.frag = `
precision highp float;
uniform sampler2D texture;
varying vec2 pT;
varying vec3 tcolor;
void main() {
	gl_FragColor = texture2D(texture, pT);
	gl_FragColor.rgb *= tcolor;
}
`



