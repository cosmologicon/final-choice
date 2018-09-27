"use strict"

Math.tau = 2 * Math.PI
Math.phi = (1 + Math.sqrt(5)) / 2
Math.norm = function (v, r) {
	if (r === undefined) r = 1
	let a = Math.hypot.apply(Math, v)
	if (a == 0) return v.map((x, j) => !j)
	return v.map(x => r * x / a)
}
Math.clamp = function (x, a, b) {
	return x < a ? a : x > b ? b : x
}
UFX.key.init()
