/**
 * @author Mikael Christensen / @SyntopiaDK
 */

var fragapi = { REVISION: '0' };

// TODO: Don't force this upon API users.
// Strategy outlined in https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/sdk/demos/common/webgl-utils.js
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
		 window.webkitRequestAnimationFrame ||
		 window.mozRequestAnimationFrame ||
		 function(callback, element) {
		   return window.setTimeout(callback, 1000/60); // If no browser support, call at 60 fps
		 };
})();

fragapi.getGlFromCanvas = function(canvasID) {
	var canvas = document.getElementById(canvasID);
	var gl;
	try {
		var settings = { antialias: false, depth: false, alpha: false };
		gl = canvas.getContext("experimental-webgl", settings);
		if (gl == null) {
			gl = canvas.getContext('webgl', settings);
		}
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL.");
	}
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	return gl;
}

fragapi.getShader = function(gl, source, type) {
	if (type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

// Some functions used from: https://developer.mozilla.org/en/WebGL/Adding_2D_content_to_a_WebGL_context
fragapi.getShaderFromElement = function(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var source = "";
		
	// 'shaderScript' is a HTMLScriptElement. 	
	// We must extract the text node.
	var currentChild = shaderScript.firstChild;
	while(currentChild) {  
		if (currentChild.nodeType == currentChild.TEXT_NODE) {  
			source += currentChild.textContent;  
		}  
		currentChild = currentChild.nextSibling;  
	}  

	return fragapi.getShader(gl, source, shaderScript.type);
}

FrameBuffer = function() {
	this.name = "Undefined";
	this.fragmentShader = "";
	this.vertexShader = "";
}

FrameBuffer.create3D = function(fragmentShader) {
	var fb = new FrameBuffer();
	fb.fragmentShader = fragmentShader;
	return fb;
}

FrameBuffer.create = function(fragmentShader, vertexShader) {
	var fb = new FrameBuffer();
	fb.fragmentShader = fragmentShader;
	fb.vertexShader = vertexShader;
	return fb;
}

FrameBuffer.prototype = {

	constructor: FrameBuffer,

	getName: function() {
		return this.name;
	},
	
	setName: function(name) {
		this.name = name;
	},
	
	setGl: function(gl) {
		this.gl = gl;
	},
	
	printDebug: function() {
		console.log(this.toString());
	},
	
	toString: function() {
		return "FrameBuffer[" + this.name + ", fragmentShader='" 
				+ this.fragmentShader + "', vertexShader = '" + this.vertexShader + "']";
	},
	
	setUniform1f : function(name, value) {
		this.gl.uniform1f( this.getUniformLocation(name), value );
	},
	
	setUniform2f : function(name, v1,v2) {
		this.gl.uniform2f( this.getUniformLocation(name), v1,v2 );
	},
	
	setUniform3f : function(name, v1,v2,v3) {
		this.gl.uniform3f( this.getUniformLocation(name), v1,v2,v3 );
	},
	
	// Load and compile.
    initShaders : function() {
		var vertexShaderSource = fragapi.getShaderFromElement(this.gl, this.vertexShader);
		var fragmentShaderSource = fragapi.getShaderFromElement(this.gl, this.fragmentShader);
		console.log(vertexShaderSource);
		this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShaderSource);
        this.gl.attachShader(this.shaderProgram, fragmentShaderSource);
        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        this.gl.useProgram(this.shaderProgram);
        this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
		
		// To debug HLSL code. Requires recent chromium build and --enable-privileged-webgl-extensions
		if (this.gl.getExtension("WEBGL_debug_shaders")) {
			//console.log(gl.getExtension("WEBGL_debug_shaders").getTranslatedShaderSource(fragmentShaderSource));
		}
    },

	// This is a simple quad
    initBuffers: function() {
		var gl = this.gl;
		this.squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
        var vertices = [
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
             1.0, -1.0,  0.0,
            -1.0, -1.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.squareVertexPositionBuffer.itemSize = 3;
        this.squareVertexPositionBuffer.numItems = 4;
    },
	
	init: function() {
		this.initBuffers();
		this.initShaders();
	},
	
	draw: function() {
		this.counter++;
		if (this.counter>1000) {
			this.animate = function() {};
			this.draw = function() {};
			console.log("Killing");
		}
		console.log("Drawing: " + this.counter);
		var gl = this.gl;
		var w = gl.viewportWidth*0.5;
		var h = gl.viewportHeight*0.5;
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
        gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);
    },
	
	updateUniforms : function() {
		console.log("Update uniforms - base");
	},
	
	getUniformLocation : function(name) {
		var loc = this.gl.getUniformLocation( this.shaderProgram, name );
		console.log("loc:" + loc);
		return loc;
	},
	
	// The main loop. We will only draw when requested to do so.
	// 'requestAnimationFrame' will only be called when the browser finds it appropriate.
	animate: function() {
		this.updateUniforms();
		if (this.dirty) {
			this.dirty = false;
			console.log("Draw");
			this.draw();
		}
		
		var self = this;
		requestAnimFrame(function() { self.animate(); } );
	},
	
	setDirty: function() {
		this.dirty = true;
	},
	
	start: function() {
		this.counter = 0;
		this.dirty = true;
		this.animate();
	},
	
	renderToCanvas: function(name) {
		this.gl = fragapi.getGlFromCanvas(name);
		fb.init();
		fb.start();
	},
	
	getWidth: function() {
		return this.gl.viewportWidth;
	},
	
	getHeight: function() {
		return this.gl.viewportHeight;
	}
}

	
	