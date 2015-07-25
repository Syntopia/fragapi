
var Camera2D = function() {
	this.mouseDownX = 0;
	this.mouseX = 0;
	this.mouseDownY = 0;
	this.mouseY = 0;
	this.centerX = 0;
	this.centerY = 0;
	
	this.zoomFactor = 1.5;
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
};

Camera2D.prototype = {

	constructor: Camera2D,

	init: function(canvasID) {
		this.addListeners(canvasID);
	},
	
	setCenter: function(x,y) {
		this.centerX = x;
		this.centerY = y;
	},
	
	setZoom: function(z) {
		this.zoom = z;
	},
	
	mouseDown: function(e) {
		var rect = this.canvas.getBoundingClientRect();
        
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
	
	mouseUp: function() {
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
		var rect = this.canvas.getBoundingClientRect();
        
		this.mouseX = e.clientX - rect.left;
		this.mouseY = e.clientY - rect.top;
		this.dirty = this.dirty || this.dragging; 
		console.log("[centerX: " +this.centerX + " centerY: " +this.centerY + " zoom: " + this.zoom +"]");
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
	
	getViewWidth: function() {
		return this.canvas.getBoundingClientRect().width;
	},
	
	getViewHeight: function() {
		return this.canvas.getBoundingClientRect().height;
	},
	
	doZoom: function(factor) {
		var dx = this.mouseX-this.getViewWidth()/2;
		var dy = this.getViewHeight()/2-this.mouseY;
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
		this.canvas.addEventListener('mousedown', function(e) { self.mouseDown(e); }, false);
		this.canvas.addEventListener('mouseup', function(e) { self.mouseUp(e); }, false);
		this.canvas.addEventListener('mouseout', function(e) { self.mouseUp(e); }, false); // check if dragging outside window.
		this.canvas.addEventListener('mousemove', function(e) { self.mouseMove(e); }, false); 
		this.canvas.addEventListener('mousewheel', function(e) { self.mouseWheel(e); }, false);
		this.canvas.addEventListener('DOMMouseScroll', function(e) { self.mouseWheel(e); }, false);
		
		document.addEventListener('keydown', function ( event ) { self.toggleStatus(event.keyCode, true, event);}, false );
		document.addEventListener('keyup',   function ( event ) { self.toggleStatus(event.keyCode, false, event);}, false );
	}
};

Camera2D.vertexShader = 
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