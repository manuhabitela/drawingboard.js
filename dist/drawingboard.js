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
		controls: ['Colors', 'Size', 'Clear', 'History']
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
	this.saveLocalStorage();
};

DrawingBoard.prototype.initControls = function() {
	for (var i = 0; i < this.opts.controls.length; i++) {
		if (window['DrawingBoard']['Control'][this.opts.controls[i]]) {
			var c = new window['DrawingBoard']['Control'][this.opts.controls[i]](this);
			this.addControl(c);
		}
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
	this.inputCoords = { x: null, y: null };
	this.mouseCoords = { x: null, y: null };
	this.midInputCoords = this.inputCoords;

	this.$canvas.on('mousedown', function(e) {
		that._onMouseDown(e, that._getMouseCoordinates(e) );
	});

	this.$canvas.on('mouseup', function(e) {
		that._onMouseUp(e, that._getMouseCoordinates(e) );
	});

	this.$canvas.on('mousemove', function(e) {
		that._onMouseMove(e, that._getMouseCoordinates(e) );
	});

	this.$canvas.on('mouseover', function(e) {
		that.inputCoords = that._getMouseCoordinates(e);
		if (e.which !== 1)
			that.isDrawing = false;
	});

	this.$canvas.on('mouseout', function(e) {

	});
	webkitRequestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
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
		var midPoint = {x: this.inputCoords.x + this.mouseCoords.x>>1, y: this.inputCoords.y + this.mouseCoords.y>>1 };
		this.ctx.moveTo(midPoint.x, midPoint.y);
		this.ctx.quadraticCurveTo(this.inputCoords.x, this.inputCoords.y, this.midInputCoords.x, this.midInputCoords.y);
		this.ctx.stroke();


		this.inputCoords = this.mouseCoords;
		this.midInputCoords = midPoint;
	}

	webkitRequestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
};

DrawingBoard.prototype._onMouseDown = function(e, coords) {
	this.saveHistory();
	this.isDrawing = true;
	this.inputCoords = coords;
	this.midInputCoords = {x: this.inputCoords.x + coords.x>>1, y: this.inputCoords.y + coords.y>>1 };
};

DrawingBoard.prototype._onMouseMove = function(e, coords) {
	this.mouseCoords = coords;
};

DrawingBoard.prototype._onMouseUp = function(e, coords) {
	if (this.isDrawing) {
		this.isDrawing = false;
		this.saveLocalStorage();
	}
};

DrawingBoard.prototype._getMouseCoordinates = function(e) {
	return {
		x: e.pageX - this.$canvas.offset().left,
		y: e.pageY - this.$canvas.offset().top
	};
};

DrawingBoard.prototype.addControl = function(control) {
	this.$el.find('.drawing-board-controls').append(control.$el);
};

DrawingBoard.Control = {};

DrawingBoard.Control.Colors = function(drawingBoard, opts) {
	this.board = drawingBoard;
	this.opts = $.extend({
		defaultColor: "rgba(255, 191, 127, 1)"
	}, opts);

	this.board.ctx.strokeStyle = this.opts.defaultColor;
	this.el = '<div class="drawing-board-control drawing-board-control-colors">' +
		'<div class="drawing-board-control-colors-current" style="background-color: ' + this.board.ctx.strokeStyle + '"></div>' +
		'<div class="drawing-board-control-colors-rainbows">';
	var that = this;

	this.fillWithRainbow(0.75);
	this.fillWithRainbow(0.5);
	this.fillWithRainbow(0.25);
	this.el += '</div>';

	this.$el = $(this.el);
	this.$el.on('click', '.drawing-board-control-colors-picker', function(e) {
		that.board.ctx.strokeStyle = $(this).attr('data-color');
		that.$el.find('.drawing-board-control-colors-current').css('background-color', $(this).attr('data-color'));
		e.preventDefault();
	});
};

DrawingBoard.Control.Colors.prototype = {
	rgba: function(r, g, b, a) {
		return { r: r, g: g, b: b, a: a, toString: function() { return "rgba(" + r +", " + g + ", " + b + ", " + a + ")"; } };
	},
	hsl: function(h, s, l) {
		return { h: h, s: s, l: l, toString: function() { return "hsl(" + h +", " + s*100 + "%, " + l*100 + "%)"; } };
	},
	hex2Rgba: function(hex) {
		var num = parseInt(hex.substring(1), 16);
		return this.rgba(num >> 16, num >> 8 & 255, num & 255, 1);
	},
	//conversion function (modified a bit) taken from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
	hsl2Rgba: function(hsl) {
		var h = hsl.h/360, s = hsl.s, l = hsl.l, r, g, b;
		function hue2rgb(p, q, t) {
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}
		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = Math.floor( (hue2rgb(p, q, h + 1/3)) * 255);
			g = Math.floor( (hue2rgb(p, q, h)) * 255);
			b = Math.floor( (hue2rgb(p, q, h - 1/3)) * 255);
		}
		return this.rgba(r, g, b, 1);
	},
	fillWithRainbow: function(l) {
		var i = 0;
		var additionalColor = null;
		var oneColorTpl = '<div class="drawing-board-control-colors-picker" data-color="{{color}}" style="background-color: {{color}}"></div>';
		this.el += '<div class="drawing-board-control-colors-rainbow">';
		if (l == 0.25)
			additionalColor = this.rgba(0, 0, 0, 1);
		if (l == 0.5)
			additionalColor = this.rgba(150, 150, 150, 1);
		if (l == 0.75)
			additionalColor = this.rgba(255, 255, 255, 1);
		if (additionalColor !== null)
			this.el += tim(oneColorTpl, {color: additionalColor.toString() });
		while (i <= 330) {
			this.el += tim(oneColorTpl, {color: this.hsl2Rgba(this.hsl(i-60, 1, l)).toString() });
			i+=30;
		}
		this.el += '</div>';
	}
};
DrawingBoard.Control.Navigation = function(drawingBoard, opts) {
	this.board = drawingBoard;
	this.opts = $.extend({
		backButton: true,
		forwardButton: true,
		resetButton: true
	}, opts);

	var that = this;
	var el = '<div class="drawing-board-control drawing-board-control-navigation">';
	if (this.opts.backButton) el += '<button class="drawing-board-control-navigation-back" title="Annuler la dernière action">&larr;</button>';
	if (this.opts.forwardButton) el += '<button class="drawing-board-control-navigation-forward" title="Recommencer la dernière action">&rarr;</button>';
	if (this.opts.resetButton) el += '<button class="drawing-board-control-navigation-reset" title="Effacer tout">×</button>';
	el += '</div>';
	this.$el = $(el);

	if (this.opts.backButton) {
		this.$el.on('click', '.drawing-board-control-navigation-back', function(e) {
			that.board.goBackInHistory();
			e.preventDefault();
		});
	}

	if (this.opts.forwardButton) {
		this.$el.on('click', '.drawing-board-control-navigation-forward', function(e) {
			//that.board.goForwardInHistory();
			e.preventDefault();
		});
	}

	if (this.opts.resetButton) {
		this.$el.on('click', '.drawing-board-control-navigation-reset', function(e) {
			that.board.reset();
			e.preventDefault();
		});
	}
};
DrawingBoard.Control.Size = function(drawingBoard) {
	this.board = drawingBoard;
	var that = this;
	var tpl = '<div class="drawing-board-control drawing-board-control-size" title="Taille du pinceau : 10">' +
		'<input type="range" min="1" max="50" value="10" class="drawing-board-control-size-input">' +
		'<span class="drawing-board-control-size-label"></span>' +
		'</div>';
	
	this.$el = $(tpl);
	this.$el.on('change', 'input', function(e) {
		that.updateView($(this).val());
		e.preventDefault();
	});
	this.updateView(this.$el.find('input').val());
};

DrawingBoard.Control.Size.prototype.updateView = function(val) {
	this.board.ctx.lineWidth = val;
	this.$el.find('.drawing-board-control-size-label').css({
		width: val + 'px',
		height: val + 'px',
		borderRadius: val + 'px'
	});
	this.$el.attr('title', 'Taille du pinceau : ' + val);
};