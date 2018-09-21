// Shaders

"use strict"
let gl, pUbuffer
let draw = {
	init: function () {
		this.pixelratio = window.devicePixelRatio || 1
		this.canvas = document.getElementById("canvas")
		gl = UFX.gl(canvas)
		if (!gl) {
			// TODO
		}
		UFX.gltext.init(gl)
		canvas.style.background = "black"
		this.portrait = false
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
		for (let j = 0 ; j < this.nstar * 3 ; ++j) stardata.push(UFX.random())
		this.starbuffer = gl.makeArrayBuffer(stardata)
	},

	startalk: function () {
		gl.clearColor(0, 0, 0, 1)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.progs.startalk.use()
		gl.progs.startalk.set({
			screen: [this.wV, this.hV],
			T: Date.now() / 30000 % 1,
		})
		this.starbuffer.bind()
		gl.progs.startalk.assignAttribOffsets({
			star: 0,
		})
		let n = Math.min(this.nstar, Math.floor(0.004 * this.wV * this.hV))
		gl.drawArrays(gl.POINTS, 0, n)
	},
}


const shaders = {
	startalk: {},
}

// Stars during visits and various menu scenes, radiating outward from the center.
shaders.startalk.vert = `
attribute vec3 star;
uniform float T;   // Range [0, 1)
uniform vec2 screen;  // screen size in pixels
varying float c;
void main() {
	float s = length(screen);
	float r = pow(mod(star.z + T, 1.0), 3.0);
	c = clamp(1.6 * r * mod(star.z * 100.0, 1.0), 0.0, 1.0);
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

