fragapi._externalShader = 
'attribute vec3 position;\n' +
'varying vec2 pos;\n' +
'varying vec2 canvasPos;\n' +
'uniform float zoom;\n' +
'uniform vec2 center;\n' +
'\n' +
'void main() {\n' +
'	pos = position.xy * zoom + center;\n' +
'	canvasPos = position.xy;\n' +
'	gl_Position =  vec4(position, 1.0);\n' +
'}\n';
fragapi.injectShader();