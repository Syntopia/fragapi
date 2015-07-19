/**
 * @author Mikael Christensen / @SyntopiaDK
 */

var fragapi = {
    REVISION: '0'
};

// TODO: Don't force this upon API users.
// Strategy outlined in https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/sdk/demos/common/webgl-utils.js
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback, element) {
            return window.setTimeout(callback, 1000 / 60); // If no browser support, call at 60 fps
        };
})();

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function() {};

fragapi.getGlFromCanvas = function(canvasID) {
    var canvas = document.getElementById(canvasID);
    var gl;
    try {
        var settings = {
            antialias: false,
            depth: false,
            alpha: false
        };
        gl = canvas.getContext("experimental-webgl", settings);
        if (gl == null) {
            gl = canvas.getContext('webgl', settings);
        }
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL.");
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    return gl;
}

fragapi.pendingOperations = [];
fragapi.externalShaders = new Map();
fragapi.pendingOperationsCounter = 0;

fragapi.loadScript = function(src, id, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = callback;
    script.src = src;
    head.appendChild(script);
    fragapi.pendingOperations.push(src);
}

fragapi.injectShader = function() {
    if (fragapi.pendingOperations.length != 1) {
        console.error("Expected one pending operation");
    }
    var src = fragapi.pendingOperations.pop();
    console.log("Retrieved shader: " + src + " %o", fragapi._externalShader.split("\n").join().substring(0, 150));
    fragapi.externalShaders.set(src, fragapi._externalShader);
}

fragapi.getShader = function(gl, source, type) {
    shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(source);
        console.log(gl.getShaderInfoLog(shader));
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
    while (currentChild) {
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
        return "FrameBuffer[" + this.name + ", fragmentShader='" + this.fragmentShader + "', vertexShader = '" + this.vertexShader + "']";
    },

    setUniform1f: function(name, value) {
        this.gl.uniform1f(this.getUniformLocation(name), value);
    },

    setUniform2f: function(name, v1, v2) {
        this.gl.uniform2f(this.getUniformLocation(name), v1, v2);
    },

    setUniform3f: function(name, v1, v2, v3) {
        this.gl.uniform3f(this.getUniformLocation(name), v1, v2, v3);
    },

    getFromElement: function(id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var source = "";

        // 'shaderScript' is a HTMLScriptElement.
        // We must extract the text node.
        var currentChild = shaderScript.firstChild;
        while (currentChild) {
            if (currentChild.nodeType == currentChild.TEXT_NODE) {
                source += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }
        return source;
    },

    resolve: function(src, callback) {
        if (fragapi.externalShaders.has(src)) {
            console.log("Found " + src + " in cache");
            return fragapi.externalShaders.get(src);
        }

        var text = this.getFromElement(src);
        if (text != null) {
            console.log("Resolved " + src + " from element");
            return text;
        }

        if (fragapi.pendingOperations.length > 0) {
            return;
        }

        var self = this;
        fragapi.loadScript(src, src, function() {
            self.initShaders();
        });
    },

    // Load and compile.
    initShaders: function() {
        if (fragapi.pendingOperationsCounter > 10) {
            console.log("I/O timed out:  %O", fragapi.pendingOperations);
            return;
        }

        if ((this.vertexShaderSource == null || this.fragmentShaderSource == null) && fragapi.pendingOperations.length == 0) {
            this.vertexShaderSource = this.resolve(this.vertexShader);
            this.fragmentShaderSource = this.resolve(this.fragmentShader);
        }

        if (fragapi.pendingOperations.length > 0) {
            console.log("Pending I/O operations: %O", fragapi.pendingOperations.join());
            var self = this;

            fragapi.pendingOperationsCounter++;

            window.setTimeout(function() {
                self.initShaders()
            }, 300);
            return;
        }
        var vertexShaderCompiled = fragapi.getShader(this.gl, this.vertexShaderSource, this.gl.VERTEX_SHADER);
        var fragmentShaderCompiled = fragapi.getShader(this.gl, this.fragmentShaderSource, this.gl.FRAGMENT_SHADER);

        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShaderCompiled);
        this.gl.attachShader(this.shaderProgram, fragmentShaderCompiled);
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

        this.start();
    },

    // This is a simple quad
    initBuffers: function() {
        var gl = this.gl;
        this.squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
        var vertices = [
            1.0, 1.0, 0.0, -1.0, 1.0, 0.0,
            1.0, -1.0, 0.0, -1.0, -1.0, 0.0
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
        if (this.counter > 1000) {
            this.animate = function() {};
            this.draw = function() {};
            console.log("Killing");
        }
        console.log("Drawing frame");
        var gl = this.gl;
        var w = gl.viewportWidth * 0.5;
        var h = gl.viewportHeight * 0.5;
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
        gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);
    },

    updateUniforms: function() {
        console.log("Update uniforms - base");
    },

    getUniformLocation: function(name) {
        var loc = this.gl.getUniformLocation(this.shaderProgram, name);
        return loc;
    },

    // The main loop. We will only draw when requested to do so.
    // 'requestAnimationFrame' will only be called when the browser finds it appropriate.
    animate: function() {
        if (this.camera) {
            this.camera.checkKeys();
            if (this.camera.dirty || this.dirty) {
                this.camera.setUniforms(fb);
                this.camera.dirty = false;
                this.dirty = true;
            }
        }

        if (this.dirty) {
            this.updateUniforms();
            this.dirty = false;
            this.draw();
        }

        var self = this;
        requestAnimFrame(function() {
            self.animate();
        });
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
        this.init();
    },

    getWidth: function() {
        return this.gl.viewportWidth;
    },

    getHeight: function() {
        return this.gl.viewportHeight;
    }
}


Camera2D = function() {
	this.mouseDownX = 0;
	this.mouseX = 0;
	this.mouseDownY = 0;
	this.mouseY = 0;
	this.centerX = 0;
	this.centerY = 0;
	
	this.zoomFactor = 2.0;
	this.zoom = 1.0;
	this.dragFactor = 2.0;
	
	this.dragging = false;
	this.dirty = false;
	this.keyUp = false; 
	this.keyDown = false;
	this.keyLeft = false;
	this.keyRight = false;
	this.keyW = false;
	this.keyS = false;
}

Camera2D.create = function(canvasID) {
	var cam = new Camera2D();
	cam.addListeners(canvasID);
	return cam;
}

Camera2D.prototype = {

	constructor: Camera2D,

	mouseDown: function(e) {
		var rect = canvas.getBoundingClientRect();
        
		this.mouseDownX = e.clientX - rect.left;
		this.mouseDownY = e.clientY - rect.top;
		this.dragging = true;
		this.dirty = true;
	},
	
	stopDragging: function() {
		if (this.dragging) {
			this.centerX -= (this.mouseX-this.mouseDownX)*this.zoom*this.dragFactor;
			this.centerY += (this.mouseY-this.mouseDownY)*this.zoom*this.dragFactor;
		}
		this.dragging = false;
		this.dirty = true;
	},
	
	mouseUp: function(e) {
		this.stopDragging();
	},
	
	mouseWheel: function(ev) {
        if (ev.detail<0.0) this.doZoom(this.zoomFactor);
		if (ev.detail>0.0) this.doZoom(1/this.zoomFactor);
		
		if (ev.wheelDelta<0.0) this.doZoom(this.zoomFactor);
		if (ev.wheelDelta>0.0) this.doZoom(1/this.zoomFactor);
		
        if (ev.preventDefault) ev.preventDefault();
		ev.returnValue = false;
		this.dirty = true;
	},
	
	mouseMove: function(e) {
		var rect = canvas.getBoundingClientRect();
        
		this.mouseX = e.clientX - rect.left;
		this.mouseY = e.clientY - rect.top;
		this.dirty = this.dirty || this.dragging; 
		console.log("Move: x: " +this.mouseX + " y: " +this.mouseY);
	},
	
	toggleStatus: function(keyCode, value, ev) {
		switch( keyCode ) {
			case 38: this.keyUp = value; break;
			case 40: this.keyDown = value; break;
			case 37: this.keyLeft = value; break;
			case 39: this.keyRight = value; break;						
			case 87: this.keyW = value; break;
			case 83: this.keyS = value; break;
			default: return;
		}
		if (ev.preventDefault) ev.preventDefault();
		ev.returnValue = false;
		
	},
	
	doZoom: function(factor) {
		dx = this.mouseX-300;
		dy = 300-this.mouseY;
		this.centerX += dx*2*this.zoom*(1-factor);
		this.centerY += dy*2*this.zoom*(1-factor);
		this.zoom *= factor;
	},
	
	checkKeys: function() {
		if (this.keyDown || this.keyUp || this.keyLeft || this.keyRight || this.keyW || this.keyS) this.dirty = true;
		if (this.keyW) this.doZoom(this.zoomFactor);
		if (this.keyS) this.doZoom(1/this.zoomFactor);
		if (this.keyDown) this.centerY += 10;
		if (this.keyUp) this.centerY -= 10;
		if (this.keyLeft) this.centerX += 10;
		if (this.keyRight) this.centerX -= 10;
	},
	
	setUniforms: function(frameBuffer) {
		var w = frameBuffer.getWidth();
		var h = frameBuffer.getHeight();
		
		var cx = this.centerX/w;
		var cy = this.centerY/h;
		
		if (this.dragging) {
			cx = (this.centerX-(this.mouseX-this.mouseDownX)*this.zoom*this.dragFactor)/w; 
			cy = (this.centerY+(this.mouseY-this.mouseDownY)*this.zoom*this.dragFactor)/h;
		}
		frameBuffer.setUniform2f('center', cx, cy);
		frameBuffer.setUniform1f('zoom', this.zoom);
	},
	
	addListeners: function(canvasID) {
		this.canvas = document.getElementById(canvasID);
		
		var self = this;
		this.canvas.addEventListener('mousedown', function(e) { self.mouseDown(e) }, false);
		this.canvas.addEventListener('mouseup', function(e) { self.mouseUp(e) }, false);
		this.canvas.addEventListener('mouseout', function(e) { self.mouseUp(e) }, false); // check if dragging outside window.
		this.canvas.addEventListener('mousemove', function(e) { self.mouseMove(e) }, false); 
		this.canvas.addEventListener('mousewheel', function(e) { self.mouseWheel(e) }, false);
		this.canvas.addEventListener('DOMMouseScroll', function(e) { self.mouseWheel(e) }, false);
		
		document.addEventListener('keydown', function ( event ) { self.toggleStatus(event.keyCode, true, event);}, false );
		document.addEventListener('keyup',   function ( event ) { self.toggleStatus(event.keyCode, false, event);}, false );
	}
	
}