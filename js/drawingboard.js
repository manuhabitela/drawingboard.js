/*!
* Tim (lite)
*   github.com/premasagar/tim
*//*
	A tiny, secure JavaScript micro-templating script.
*/
var tim=function(){var e=/{{\s*([a-z0-9_][\\.a-z0-9_]*)\s*}}/gi;return function(f,g){return f.replace(e,function(h,i){for(var c=i.split("."),d=c.length,b=g,a=0;a<d;a++){b=b[c[a]];if(b===void 0)throw"tim: '"+c[a]+"' not found in "+h;if(a===d-1)return b}})}}();

var DrawingBoard = function(selector, opts) {
	var that = this;
	var tpl = '<div class="drawing-board-buttons"></div><canvas class="drawing-board-canvas" width={{width}} height={{height}}></canvas>';
	this.opts = $.extend({ width: 600, height: 600, controls: ['Clear'] }, opts);
	this.selector = selector;
	this.$el = $(this.selector);
	this.$el.css({ width: this.opts.width + 'px', height: this.opts.height + 'px'}).append( tim(tpl, this.opts) );
	this.$canvas = this.$el.find('canvas');
	this.canvas = this.$canvas.get(0);
	this.ctx = this.canvas.getContext('2d');

	this.reset();

	if (window.localStorage && localStorage.getItem('curImg') !== null) {
		this.restoreImg(localStorage.getItem('curImg'));
	}

	this.initHistoryEvents();
	this.initDrawEvents();
	this.initControls();
};

DrawingBoard.prototype.reset = function() {
	this.ctx.lineCap = "round";
	this.ctx.save();
	this.ctx.fillStyle = '#f1f1f1';
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.restore();
};

DrawingBoard.prototype.initHistoryEvents = function() {
	var that = this;
	window.onpopstate = function(e) {
		if (e.state && e.state.imageData) {
			that.restoreImg(e.state.imageData);
		}
	};
};

DrawingBoard.prototype.initControls = function() {
	for (var i = this.opts.controls.length - 1; i >= 0; i--) {
		var c = new window['DrawingBoard']['Control'][this.opts.controls[i]](this);
		this.addControl(c);
	}
};

DrawingBoard.prototype.initDrawEvents = function() {
	var that = this;
	this.isDrawing = false;
	this.inputCoords = { x: null, y: null };

	this.$canvas.on('mousedown', function(e) {
		that._onMouseDown(e, that._getMouseCoordinates(e) );
	});

	this.$canvas.on('mouseup', function(e) {
		that._onMouseUp(e, that._getMouseCoordinates(e) );
	});

	this.$canvas.on('mousemove', function(e) {
		that._onMouseMove(e, that._getMouseCoordinates(e) );
	});

	this.$canvas.on('mouseout', function(e) {
		that.isDrawing = false;
	});
};

DrawingBoard.prototype.restoreImg = function(src) {
	var that = this;
	img = new Image();
	img.onload = function () {
		that.ctx.drawImage(img, 0, 0);
	};
	img.src = src;
};

DrawingBoard.prototype.saveHistory = function () {
	if (window.history && window.history.pushState && window.localStorage) {
		img = this.canvas.toDataURL("image/png");
		history.pushState({ imageData: img }, "", window.location.href);
		localStorage.setItem('curImg', img);
	}
};

DrawingBoard.prototype._onMouseDown = function(e, coords) {
	this.isDrawing = true;
	this.inputCoords = coords;
};

DrawingBoard.prototype._onMouseMove = function(e, coords) {
	if (this.isDrawing) {
		this.ctx.beginPath();
		this.ctx.moveTo(this.inputCoords.x, this.inputCoords.y);
		this.ctx.lineTo(coords.x, coords.y);
		this.ctx.stroke();
		this.ctx.closePath();

		this.inputCoords = coords;
	}
};

DrawingBoard.prototype._onMouseUp = function(e, coords) {
	if (this.isDrawing) {
		this.isDrawing = false;
		this.saveHistory();
	}
};

DrawingBoard.prototype._getMouseCoordinates = function(e) {
	return {
		x: e.pageX - this.$canvas.offset().left,
		y: e.pageY - this.$canvas.offset().top
	};
};

DrawingBoard.prototype.addControl = function(control) {
	this.$el.find('.drawing-board-buttons').append(control.$el);
};

DrawingBoard.Control = {};

DrawingBoard.Control.Clear = function(drawingBoard) {
	var that = this;
	this.board = drawingBoard;
	this.$el = $('<button class=drawing-board-button-clear>Effacer tout</button>');
	this.$el.on('click', function(e) {
		that.board.reset();
		that.board.saveHistory();
		e.preventDefault();
	});
};