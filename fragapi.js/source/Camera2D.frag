attribute vec3 position;
varying vec2 pos;
varying vec2 canvasPos;
uniform float zoom;
uniform vec2 center;

void main() {
	pos = position.xy * zoom + center;
	canvasPos = position.xy;
	gl_Position =  vec4(position, 1.0);
}