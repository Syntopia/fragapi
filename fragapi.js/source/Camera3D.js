
Camera3D = function() {
	this.mouseDownX = 0;
	this.mouseX = 0;
	this.mouseDownY = 0;
	this.mouseY = 0;
	this.centerX = 0;
	this.centerY = 0;
	
	this.right = [ 0.7f, 0, -0.7f ];
    this.up = [ 0.4f, -0.8f, 0.4f ];
    this.forward = [ 0.57f, 0.57f, 0.57f ];
    this.pos = [ 0, 0, -6 ];
	
	this.zoomFactor = 1.3;
	this.zoom = 1.0;
	this.dragFactor = 3.0;
	
	this.dragging = false;
	this.dirty = false;
	this.keyUp = false; 
	this.keyDown = false;
	this.keyLeft = false;
	this.keyRight = false;
	this.keyW = false;
	this.keyS = false;
}

Camera3D.create = function(canvasID) {
	var cam = new Camera3D();
	cam.addListeners(canvasID);
	return cam;
}

Camera3D.prototype = {

	constructor: Camera3D,

	getPosInCameraCoords : function() {
        return pos;
    }
    
    getPosInWorldCoords() : function() {
        // [ r.x r.y r.z q.x ]
        // [ u.x u.y u.z q.y ]
        // [ -f.x -f.y -f.z q.z ]
        // [ 0 0 0 1 ]
        // eye = -(modelView[3].xyz)*mat3(modelView);
        return [
                -pos[0] * right[0] - pos[1] * up[0] + pos[2] * forward[0],
                -pos[0] * right[1] - pos[1] * up[1] + pos[2] * forward[1],
                -pos[0] * right[2] - pos[1] * up[2] + pos[2] * forward[2],
        ];
    }
	
	mouseDown: function(e) {
		this.mouseDownX = e.clientX;
		this.mouseDownY = e.clientY;
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
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		this.dirty = this.dirty || this.dragging; 
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
		var canvas = document.getElementById(canvasID);
	
		var self = this;
		canvas.addEventListener('mousedown', function(e) { self.mouseDown(e) }, false);
		canvas.addEventListener('mouseup', function(e) { self.mouseUp(e) }, false);
		canvas.addEventListener('mouseout', function(e) { self.mouseUp(e) }, false); // check if dragging outside window.
		canvas.addEventListener('mousemove', function(e) { self.mouseMove(e) }, false); 
		canvas.addEventListener('mousewheel', function(e) { self.mouseWheel(e) }, false);
		canvas.addEventListener('DOMMouseScroll', function(e) { self.mouseWheel(e) }, false);
		
		document.addEventListener('keydown', function ( event ) { self.toggleStatus(event.keyCode, true, event);}, false );
		document.addEventListener('keyup',   function ( event ) { self.toggleStatus(event.keyCode, false, event);}, false );
	}
	
}