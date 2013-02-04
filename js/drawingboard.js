/*!
* Tim (lite)
*   github.com/premasagar/tim
*//*
	A tiny, secure JavaScript micro-templating script.
*/
var tim=function(){var e=/{{\s*([a-z0-9_][\\.a-z0-9_]*)\s*}}/gi;return function(f,g){return f.replace(e,function(h,i){for(var c=i.split("."),d=c.length,b=g,a=0;a<d;a++){b=b[c[a]];if(b===void 0)throw"tim: '"+c[a]+"' not found in "+h;if(a===d-1)return b}})}}();

var DrawingBoard = function(selector, opts) {
	var that = this;
	var tpl = '<div class="drawing-board-controls"></div><canvas class="drawing-board-canvas" width={{width}} height={{height}}></canvas>';
	this.opts = $.extend({
		width: 600,
		height: 600,
		controls: ['Colors', 'Size', 'Navigation']
	}, opts);
	this.selector = selector;
	this.$el = $(this.selector);
	this.$el.addClass('drawing-board').css({ width: this.opts.width + 'px', height: this.opts.height + 'px'}).append( tim(tpl, this.opts) );
	this.$canvas = this.$el.find('canvas');
	this.canvas = this.$canvas.get(0);
	this.ctx = this.canvas.getContext('2d');

	this.reset();

	this.initHistory();
	this.restoreLocalStorage();
	this.initDrawEvents();
	this.initControls();
};

DrawingBoard.prototype.reset = function() {
	this.ctx.lineCap = "round";
	this.ctx.lineJoin = "round";
	this.ctx.save();
	this.ctx.fillStyle = '#ffffff';
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.restore();
};

DrawingBoard.prototype.initControls = function() {
	for (var i = 0; i < this.opts.controls.length; i++) {
		var c = new window['DrawingBoard']['Control'][this.opts.controls[i]](this);
		this.addControl(c);
	}
};

DrawingBoard.prototype.initHistory = function() {
	this.history = [];
};

DrawingBoard.prototype.restoreLocalStorage = function() {
	if (window.localStorage && localStorage.getItem('drawing-board-image') !== null) {
		this.restoreImg(localStorage.getItem('drawing-board-image'));
	}
};

DrawingBoard.prototype.initDrawEvents = function() {
	var that = this;
	this.isDrawing = false;
	this.oldInputCoords = this.inputCoords = this.oldInputCoords = { x: null, y: null };

	this.$canvas.on('mousedown', function(e) {
		that._onMouseDown(e, that._getInputCoords(e) );
	});

	this.$canvas.on('mouseup', function(e) {
		that._onMouseUp(e, that._getInputCoords(e) );
	});

	this.$canvas.on('mousemove', function(e) {
		that._onMouseMove(e, that._getInputCoords(e) );
	});

	this.$canvas.on('mouseover', function(e) {
		that.oldInputCoords = that._getInputCoords(e);
		if (e.which !== 1)
			that.isDrawing = false;
	});

	this.$canvas.on('mouseout', function(e) {

	});
	requestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
};

DrawingBoard.prototype.restoreImg = function(src) {
	var that = this;
	img = new Image();
	img.onload = function () {
		that.ctx.drawImage(img, 0, 0);
	};
	img.src = src;
};

DrawingBoard.prototype._getImage = function() {
	return this.canvas.toDataURL("image/png");
};

DrawingBoard.prototype.saveHistory = function () {
	if (this.history === undefined) this.history = [];
	while (this.history.length > 30) {
		this.history.shift();
	}
	this.history.push(this._getImage());
};

DrawingBoard.prototype.goBackInHistory = function() {
	if (this.history.length)
		this.restoreImg(this.history.pop());
	this.saveLocalStorage();
};

DrawingBoard.prototype.saveLocalStorage = function() {
	if (window.localStorage) {
		localStorage.setItem('drawing-board-image', this._getImage());
	}
};

DrawingBoard.prototype.draw = function() {
	if (this.isDrawing) {
		this.ctx.beginPath();
		var midPoint = this._getMidInputCoords(this.inputCoords);
		this.ctx.moveTo(midPoint.x, midPoint.y);
		this.ctx.quadraticCurveTo(this.oldInputCoords.x, this.oldInputCoords.y, this.midInputCoords.x, this.midInputCoords.y);
		this.ctx.stroke();

		this.oldInputCoords = this.inputCoords;
		this.midInputCoords = midPoint;
	}

	requestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
};

DrawingBoard.prototype._onMouseDown = function(e, coords) {
	this.saveHistory();
	this.isDrawing = true;
	this.oldInputCoords = coords;
	this.midInputCoords = this._getMidInputCoords(coords);
};

DrawingBoard.prototype._onMouseMove = function(e, coords) {
	this.inputCoords = coords;
};

DrawingBoard.prototype._onMouseUp = function(e, coords) {
	if (this.isDrawing) {
		this.isDrawing = false;
		this.saveLocalStorage();
	}
};

DrawingBoard.prototype._getInputCoords = function(e) {
	return {
		x: e.pageX - this.$canvas.offset().left,
		y: e.pageY - this.$canvas.offset().top
	};
};

DrawingBoard.prototype._getMidInputCoords = function(coords) {
	return {
		x: this.oldInputCoords.x + coords.x>>1,
		y: this.oldInputCoords.y + coords.y>>1
	};
};

DrawingBoard.prototype.addControl = function(control) {
	this.$el.find('.drawing-board-controls').append(control.$el);
};

DrawingBoard.Control = {};