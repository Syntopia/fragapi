fragapi._externalShader = 
'precision highp float;\n' +
'	\n' +
'		varying vec2 pos;        // camera dependent position, default is (-1,-1) to (1,1)\n' +
'		varying vec2 canvasPos;  // absolute position, independent of camera\n' +
'		uniform vec2 resolution; // frame buffer size, in pixels\n' +
'		uniform float time;      // time since start, in seconds\n' +
'\n' +
'		// Color parameters\n' +
'		const vec3 RGB = vec3(0.0,0.43,1.);\n' +
'		const float Divider = 23.;\n' +
'		const float Power = 1.2;\n' +
'		const float Radius = 0.7037;\n' +
'		const int iterations = 100;\n' +
'		\n' +
'		float rand(vec2 co){\n' +
'			// implementation found at: lumina.sourceforge.net/Tutorials/Noise.html\n' +
'			return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n' +
'		}\n' +
'\n' +
'		vec2 complexMul(vec2 a, vec2 b) {\n' +
'			return vec2( a.x*b.x -  a.y*b.y,a.x*b.y + a.y * b.x);\n' +
'		}\n' +
'		\n' +
'		vec3 color(vec2 c, bool Julia, vec2 JuliaC, float falloff) {\n' +
'			vec2 z = Julia ?  c : vec2(0.0,0.0);\n' +
'			vec2 add =  (Julia ? JuliaC : c);\n' +
'			int j = iterations;\n' +
'			for (int i = 0; i <= iterations; i++) {\n' +
'				if (dot(z,z)> 1000.0) { break; }\n' +
'				z = complexMul(z,z) + add;\n' +
'				j = i; \n' +
'			}\n' +
'			\n' +
'			if (j < iterations) {\n' +
'				// The color scheme here is based on one\n' +
'				// from the Mandelbrot in Inigo Quilez\'s Shader Toy:\n' +
'				float co = float( j) + 1.0 - log2(.5*log2(dot(z,z)));\n' +
'				co = sqrt(max(0.,co)/256.0);\n' +
'				co += rand(pos)*0.02;\n' +
'				return falloff*vec3( .5+.5*cos(6.2831*co+RGB) );\n' +
'			}  else {\n' +
'				// Inside \n' +
'				return vec3(0.05,0.01,0.02);\n' +
'			}\n' +
'		}\n' +
'			\n' +
'		vec3 mandel() {\n' +
'			float falloff = exp(-dot(canvasPos,canvasPos)/(1.0+0.2*rand(canvasPos)));\n' +
'			return color(pos, false, vec2(0.0),falloff);\n' +
'		}\n' +
'		\n' +
'		\n' +
'		void main() {\n' +
'			vec3 v =  mandel();\n' +
'			gl_FragColor = vec4(pow(v,vec3(1./2.2)),1.0);\n' +
'		}\n' +
'		\n';
fragapi.injectShader();