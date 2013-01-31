/*!
* Tim (lite)
*   github.com/premasagar/tim
*//*
	A tiny, secure JavaScript micro-templating script.
*/
var tim=function(){var e=/{{\s*([a-z0-9_][\\.a-z0-9_]*)\s*}}/gi;return function(f,g){return f.replace(e,function(h,i){for(var c=i.split("."),d=c.length,b=g,a=0;a<d;a++){b=b[c[a]];if(b===void 0)throw"tim: '"+c[a]+"' not found in "+h;if(a===d-1)return b}})}}();

var Color = {
	rgba: function(r, g, b, a) {
		return {
			r: r,
			g: g,
			b: b,
			a: a,
			toString: function() { return "rgba(" + r +", " + g + ", " + b + ", " + a + ")"; }
		};
	},
	hsl: function(h, s, l) {
		return {
			h: h,
			s: s,
			l: l,
			toString: function() { return "hsl(" + h +", " + s*100 + "%, " + l*100 + "%)"; }
		};
	},
	hex2Rgba: function(hex) {
		var num = parseInt(hex.substring(1), 16);
		return Color.rgba(num >> 16, num >> 8 & 255, num & 255, 1);
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
		return Color.rgba(r, g, b, 1);
	}
};

var DrawingBoard = function(selector, opts) {
	var that = this;
	var tpl = '<div class="drawing-board-buttons"></div><canvas class="drawing-board-canvas" width={{width}} height={{height}}></canvas>';
	this.opts = $.extend({ width: 600, height: 600, controls: ['Color', 'Clear', 'Size'] }, opts);
	this.selector = selector;
	this.$el = $(this.selector);
	this.$el.addClass('drawing-board').css({ width: this.opts.width + 'px', height: this.opts.height + 'px'}).append( tim(tpl, this.opts) );
	this.$canvas = this.$el.find('canvas');
	this.canvas = this.$canvas.get(0);
	this.ctx = this.canvas.getContext('2d');

	this.reset();

	this.initHistoryEvents();
	this.initDrawEvents();
	this.initControls();
};

DrawingBoard.prototype.reset = function() {
	this.ctx.lineCap = "round";
	this.ctx.save();
	this.ctx.fillStyle = '#ffffff';
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.restore();
};

DrawingBoard.prototype.initHistoryEvents = function() {
	var that = this;
	if (window.localStorage && localStorage.getItem('curImg') !== null) {
		this.restoreImg(localStorage.getItem('curImg'));
	}
	window.onpopstate = function(e) {
		if (e.state && e.state.imageData) {
			that.restoreImg(e.state.imageData);
		}
	};
};

DrawingBoard.prototype.initControls = function() {
	for (var i = 0; i < this.opts.controls.length; i++) {
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

	this.$canvas.on('mouseover', function(e) {
		that.inputCoords = that._getMouseCoordinates(e);
		if (e.which !== 1)
			that.isDrawing = false;
	});

	this.$canvas.on('mouseout', function(e) {

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
	this.$el = $('<button class="drawing-board-button drawing-board-button-clear">Effacer tout</button>');
	this.$el.on('click', function(e) {
		that.board.reset();
		that.board.saveHistory();
		e.preventDefault();
	});
};

DrawingBoard.Control.Size = function(drawingBoard) {
	var that = this;
	this.board = drawingBoard;
	this.$el = $('<input type="range" min="1" max="50" value="3" class="drawing-board-button drawing-board-button-size">');
	this.$el.on('change', function(e) {
		that.board.ctx.lineWidth = $(this).val();
		e.preventDefault();
	});
	this.board.ctx.lineWidth = this.$el.val();
};

DrawingBoard.Control.Color = function(drawingBoard) {
	this.board = drawingBoard;
	this.board.ctx.strokeStyle = "rgba(255, 191, 127, 1)";
	var that = this;
	var el = '<div class="drawing-board-button drawing-board-button-colors">' +
		'<div class="drawing-board-button-colors-current" style="background-color: ' + this.board.ctx.strokeStyle + '"></div>' +
		'<div class="drawing-board-button-colors-rainbows">';
	var oneColorTpl = '<div class="drawing-board-button-colors-picker" data-color="{{color}}" style="background-color: {{color}}"></div>';
	function fillWithRainbow(l) {
		var i = 0;
		var additionalColor = null;
		el += '<div class="drawing-board-button-colors-rainbow">';
		if (l == 0.25)
			additionalColor = Color.rgba(0, 0, 0, 1);
		if (l == 0.5)
			additionalColor = Color.rgba(150, 150, 150, 1);
		if (l == 0.75)
			additionalColor = Color.rgba(255, 255, 255, 1);
		if (additionalColor !== null)
			el += tim(oneColorTpl, {color: additionalColor.toString() });
		while (i <= 330) {
			el += tim(oneColorTpl, {color: Color.hsl2Rgba(Color.hsl(i-60, 1, l)).toString() });
			i+=30;
		}
		el += '</div>';
	}
	fillWithRainbow(0.75);
	fillWithRainbow(0.5);
	fillWithRainbow(0.25);
	el += '</div>';

	this.$el = $(el);
	this.$el.on('click', '.drawing-board-button-colors-picker', function(e) {
		that.board.ctx.strokeStyle = $(this).attr('data-color');
		that.$el.find('.drawing-board-button-colors-current').css('background-color', $(this).attr('data-color'));
		e.preventDefault();
	});
	this.board.ctx.lineWidth = this.$el.val();
};