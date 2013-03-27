window.DrawingBoard = {
	Board: {},
	Utils: {},
	Control: {}
};
/**
 * pass the id of the html element to put the drawing board into
 * and some options : {
 *	controls: array of controls to initialize with the drawingboard. 'Colors', 'Size', and 'Navigation' by default
 *		instead of simple strings, you can pass an object to define a control opts
 *		ie ['Color', { Navigation: { reset: false }}]
 *	background: background of the drawing board. Give a hex color or an image url "#ffffff" (white) by default
 *	color: pencil color ("#000000" by default)
 *	size: pencil size (3 by default)
 *	localStorage: true or false (false by default). If true, store the current drawing in localstorage and restore it when you come back
 * }
 */
DrawingBoard.Board = function(id, opts) {
	var tpl = '<div class="drawing-board-controls"></div><div class="drawing-board-canvas-wrapper"><canvas class="drawing-board-canvas"></canvas><div class="drawing-board-cursor hidden"></div></div>';

	this.opts = $.extend({
		controls: ['Color', 'Size', 'Navigation'],
		background: "#ffffff",
		localStorage: false,
		color: "#000000",
		size: 3
	}, opts);

	this.ev = new DrawingBoard.Utils.MicroEvent();

	this.id = id;
	this.$el = $(document.getElementById(id));
	if (!this.$el.length)
		return false;

	this.$el.addClass('drawing-board').append(tpl);
	this.dom = {
		$canvasWrapper: this.$el.find('.drawing-board-canvas-wrapper'),
		$canvas: this.$el.find('.drawing-board-canvas'),
		$cursor: this.$el.find('.drawing-board-cursor'),
		$controls: this.$el.find('.drawing-board-controls')
	};

	this.canvas = this.dom.$canvas.get(0);
	this.ctx = this.canvas.getContext('2d');

	this.initControls();
	this.reset({ localStorage: false });
	this.restoreLocalStorage();
	this.initDrawEvents();
};


DrawingBoard.Board.prototype = {

	/**
	 * reset the drawing board and its controls
	 * - recalculates canvas size
	 * - change background based on default one or given one in the opts object
	 * - store the reseted drawing board in localstorage if opts.localStorage is true (it is by default)
	 */
	reset: function(opts) {
		opts = $.extend({
			background: this.opts.background,
			color: this.opts.color,
			size: this.opts.size,
			history: true,
			localStorage: true
		}, opts);

		var bgIsColor = (opts.background.charAt(0) == '#' && (opts.background.length == 7 || opts.background.length == 4 )) ||
				(opts.background.substring(0, 3) == 'rgb');

		//I know.
		var width = this.$el.width() -
			DrawingBoard.Utils.boxBorderWidth(this.$el) -
			DrawingBoard.Utils.boxBorderWidth(this.dom.$canvasWrapper, true, true);
		var height = this.$el.height() -
			DrawingBoard.Utils.boxBorderHeight(this.$el) -
			this.dom.$controls.height() -
			DrawingBoard.Utils.boxBorderHeight(this.dom.$controls, false, true) -
			DrawingBoard.Utils.boxBorderHeight(this.dom.$canvasWrapper, true, true);
		this.dom.$canvasWrapper.css('width', width + 'px');
		this.dom.$canvasWrapper.css('height', height + 'px');
		this.canvas.width = width;
		this.canvas.height = height;

		this.ctx.strokeStyle = opts.color;
		this.ctx.lineWidth = opts.size;
		this.ctx.lineCap = "round";
		this.ctx.lineJoin = "round";
		this.ctx.save();
		if (bgIsColor)
			this.ctx.fillStyle = opts.background;
		this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.restore();

		if (!bgIsColor)
			this.setImg(this.opts.background);

		if (opts.localStorage) this.saveLocalStorage();

		this.ev.trigger('board:reset', opts);
	},



	/**
	 * Controls:
	 * the drawing board can has various UI elements to control it.
	 * one control is represented by a class in the namespace DrawingBoard.Control
	 * it must have a $el property (jQuery object), representing the html element to append on the drawing board at initialization.
	 * if it has a reset method, it will be called by the reset method of the drawing board
	 *
	 * An example control is given in controls/example.js.
	 */

	initControls: function() {
		this.controls = [];
		if (!this.opts.controls.length) return false;
		for (var i = 0; i < this.opts.controls.length; i++) {
			var c = null;
			if (typeof this.opts.controls[i] == "string")
				c = new window['DrawingBoard']['Control'][this.opts.controls[i]](this);
			else if (typeof this.opts.controls[i] == "object") {
				for (var controlName in this.opts.controls[i]) break;
				c = new window['DrawingBoard']['Control'][controlName](this, this.opts.controls[i][controlName]);
			}
			if (c) {
				this.controls.push(c);
				this.addControl(c);
			}
		}
	},

	addControl: function(control) {
		if (!control.board)
			control.board = this;
		if (!this.controls)
			this.controls = [];
		this.controls.push(control);
		this.dom.$controls.append(control.$el);
	},



	/**
	 * Image methods: you can directly put an image on the canvas, get it in base64 data url or start a download
	 */

	setImg: function(src) {
		img = new Image();
		img.onload = $.proxy(function() {
			this.ctx.drawImage(img, 0, 0);
		}, this);
		img.src = src;
	},

	getImg: function() {
		return this.canvas.toDataURL("image/png");
	},

	downloadImg: function() {
		var img = this.getImg();
		img = img.replace("image/png", "image/octet-stream");
		window.location.href = img;
	},



	/**
	 * localStorage handling : save and restore
	 */

	restoreLocalStorage: function() {
		if (this.opts.localStorage && window.localStorage && localStorage.getItem('drawing-board-image-' + this.id) !== null) {
			this.setImg(localStorage.getItem('drawing-board-image-' + this.id));
			this.ev.trigger('board:restoreLocalStorage', localStorage.getItem('drawing-board-image-' + this.id));
		}
	},

	saveLocalStorage: function() {
		if (this.opts.localStorage && window.localStorage) {
			localStorage.setItem('drawing-board-image-' + this.id, this.getImg());
			this.ev.trigger('board:saveLocalStorage', this.getImg());
		}
	},



	/**
	 * Drawing handling, with mouse or touch
	 */

	initDrawEvents: function() {
		this.isDrawing = false;
		this.isMouseHovering = false;
		this.coords = {};
		this.coords.old = this.coords.current = this.coords.oldMid = { x: 0, y: 0 };

		this.dom.$canvas.on('mousedown touchstart', $.proxy(function(e) {
			this._onInputStart(e, this._getInputCoords(e) );
		}, this));

		this.dom.$canvas.on('mousemove touchmove', $.proxy(function(e) {
			this._onInputMove(e, this._getInputCoords(e) );
		}, this));

		this.dom.$canvas.on('mousemove', $.proxy(function(e) {

		}, this));

		this.dom.$canvas.on('mouseup touchend', $.proxy(function(e) {
			this._onInputStop(e, this._getInputCoords(e) );
		}, this));

		this.dom.$canvas.on('mouseover', $.proxy(function(e) {
			this._onMouseOver(e, this._getInputCoords(e) );
		}, this));

		this.dom.$canvas.on('mouseout', $.proxy(function(e) {
			this._onMouseOut(e, this._getInputCoords(e) );

		}, this));
		requestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
	},

	draw: function() {
		//if the pencil size is big (>10), the small crosshair makes a friend: a circle of the size of the pencil
		if (this.ctx.lineWidth > 10 && this.isMouseHovering) {
			this.dom.$cursor.css({ width: this.ctx.lineWidth + 'px', height: this.ctx.lineWidth + 'px' });
			var transform = DrawingBoard.Utils.tpl("translateX({{x}}px) translateY({{y}}px)", { x: this.coords.current.x-(this.ctx.lineWidth/2), y: this.coords.current.y-(this.ctx.lineWidth/2) });
			this.dom.$cursor.css({ 'transform': transform, '-webkit-transform': transform, '-ms-transform': transform });
			this.dom.$cursor.removeClass('drawing-board-utils-hidden');
		} else {
			this.dom.$cursor.addClass('drawing-board-utils-hidden');
		}

		if (this.isDrawing) {
			var currentMid = this._getMidInputCoords(this.coords.current);
			this.ctx.beginPath();
			this.ctx.moveTo(currentMid.x, currentMid.y);
			this.ctx.quadraticCurveTo(this.coords.old.x, this.coords.old.y, this.coords.oldMid.x, this.coords.oldMid.y);
			this.ctx.stroke();

			this.coords.old = this.coords.current;
			this.coords.oldMid = currentMid;
		}

		requestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
	},

	_onInputStart: function(e, coords) {
		this.coords.current = this.coords.old = coords;
		this.coords.oldMid = this._getMidInputCoords(coords);
		this.isDrawing = true;

		this.ev.trigger('board:startDrawing', {e: e, coords: coords});
		e.preventDefault();
	},

	_onInputMove: function(e, coords) {
		this.coords.current = coords;

		this.ev.trigger('board:drawing', {e: e, coords: coords});
		e.preventDefault();
	},

	_onInputStop: function(e, coords) {
		if (this.isDrawing && (!e.touches || e.touches.length === 0)) {
			this.isDrawing = false;

			this.saveLocalStorage();

			this.ev.trigger('board:stopDrawing', {e: e, coords: coords});
			e.preventDefault();
		}
	},

	_onMouseOver: function(e, coords) {
		this.isMouseHovering = true;
		this.coords.old = this._getInputCoords(e);
		this.coords.oldMid = this._getMidInputCoords(this.coords.old);
		if (e.which !== 1)
			this.isDrawing = false;

		this.ev.trigger('board:mouseOver', {e: e, coords: coords});
	},

	_onMouseOut: function(e, coords) {
		this.isMouseHovering = false;

		this.ev.trigger('board:mouseOut', {e: e, coords: coords});
	},

	_getInputCoords: function(e) {
		var x, y;
		if (e.touches && e.touches.length == 1) {
			x = e.touches[0].pageX;
			y = e.touches[0].pageY;
		} else {
			x = e.pageX;
			y = e.pageY;
		}
		return {
			x: x - this.dom.$canvas.offset().left,
			y: y - this.dom.$canvas.offset().top
		};
	},

	_getMidInputCoords: function(coords) {
		return {
			x: this.coords.old.x + coords.x>>1,
			y: this.coords.old.y + coords.y>>1
		};
	}
};
DrawingBoard.Utils = {};

/*!
* Tim (lite)
*   github.com/premasagar/tim
*//*
	A tiny, secure JavaScript micro-templating script.
*/
DrawingBoard.Utils.tpl = (function(){
	"use strict";

	var start   = "{{",
		end     = "}}",
		path    = "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
		pattern = new RegExp(start + "\\s*("+ path +")\\s*" + end, "gi"),
		undef;

	return function(template, data){
		// Merge data into the template string
		return template.replace(pattern, function(tag, token){
			var path = token.split("."),
				len = path.length,
				lookup = data,
				i = 0;

			for (; i < len; i++){
				lookup = lookup[path[i]];

				// Property not found
				if (lookup === undef){
					throw "tim: '" + path[i] + "' not found in " + tag;
				}

				// Return the required value
				if (i === len - 1){
					return lookup;
				}
			}
		});
	};
}());

/**
 * https://github.com/jeromeetienne/microevent.js
 * MicroEvent - to make any js object an event emitter (server or browser)
 * 
 * - pure javascript - server compatible, browser compatible
 * - dont rely on the browser doms
 * - super simple - you get it immediatly, no mistery, no magic involved
 *
 * - create a MicroEventDebug with goodies to debug
 *   - make it safer to use
*/
DrawingBoard.Utils.MicroEvent = function(){};

DrawingBoard.Utils.MicroEvent.prototype = {
	bind : function(event, fct){
		this._events = this._events || {};
		this._events[event] = this._events[event]	|| [];
		this._events[event].push(fct);
	},
	unbind : function(event, fct){
		this._events = this._events || {};
		if( event in this._events === false  )	return;
		this._events[event].splice(this._events[event].indexOf(fct), 1);
	},
	trigger : function(event /* , args... */){
		this._events = this._events || {};
		if( event in this._events === false  )	return;
		for(var i = 0; i < this._events[event].length; i++){
			this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}
};


//I know.
DrawingBoard.Utils._boxBorderSize = function($el, withPadding, withMargin, direction) {
	withPadding = !!withPadding || true;
	withMargin = !!withMargin || false;
	var width = 0,
		props;
	if (direction == "width") {
		props = ['border-left-width', 'border-right-width'];
		if (withPadding) props.push('padding-left', 'padding-right');
		if (withMargin) props.push('margin-left', 'margin-right');
	} else {
		props = ['border-top-width', 'border-bottom-width'];
		if (withPadding) props.push('padding-top', 'padding-bottom');
		if (withMargin) props.push('margin-top', 'margin-bottom');
	}
	for (var i = props.length - 1; i >= 0; i--)
		width += parseInt($el.css(props[i]).replace('px', ''), 10);
	return width;
};

DrawingBoard.Utils.boxBorderWidth = function($el, withPadding, withMargin) {
	return DrawingBoard.Utils._boxBorderSize($el, withPadding, withMargin, 'width');
};

DrawingBoard.Utils.boxBorderHeight = function($el, withPadding, withMargin) {
	return DrawingBoard.Utils._boxBorderSize($el, withPadding, withMargin, 'height');
};

//included requestAnimationFrame (https://gist.github.com/paulirish/1579671) polyfill since it's really light
//remove it and rebuild the minified files with grunt if you don't need it
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
DrawingBoard.Control.Color = function(drawingBoard, opts) {
	this.board = drawingBoard || null;
	this.opts = $.extend({
		defaultColor: "rgba(0, 0, 0, 1)"
	}, opts);

	this.board.ctx.strokeStyle = this.opts.defaultColor;
	this.el = '<div class="drawing-board-control drawing-board-control-colors">' +
		'<div class="drawing-board-control-colors-current" style="background-color: ' + this.board.ctx.strokeStyle + '" data-color="' + this.board.ctx.strokeStyle + '"></div>' +
		'<div class="drawing-board-control-colors-rainbows">';
	var that = this;

	this.fillWithRainbow(0.75);
	this.fillWithRainbow(0.5);
	this.fillWithRainbow(0.25);
	this.el += '</div>';

	this.$el = $(this.el);
	this.$el.on('click', '.drawing-board-control-colors-picker', function(e) {
		that.board.ctx.strokeStyle = $(this).attr('data-color');
		that.$el.find('.drawing-board-control-colors-current')
			.css('background-color', $(this).attr('data-color'))
			.attr('data-color', $(this).attr('data-color'));
		e.preventDefault();
	});

	this.$el.on('click', '.drawing-board-control-colors-current', function(e) {
		that.board.reset({ background: $(this).attr('data-color') });
		e.preventDefault();
	});

	this.board.ev.bind('board:reset', $.proxy(function(opts) { this.onBoardReset(opts); }, this));
};

DrawingBoard.Control.Color.prototype = {
	onBoardReset: function(opts) {
		this.board.ctx.strokeStyle = this.$el.find('.drawing-board-control-colors-current').attr('data-color');
	},
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
			this.el += DrawingBoard.Utils.tpl(oneColorTpl, {color: additionalColor.toString() });
		while (i <= 330) {
			this.el += DrawingBoard.Utils.tpl(oneColorTpl, {color: this.hsl2Rgba(this.hsl(i-60, 1, l)).toString() });
			i+=30;
		}
		this.el += '</div>';
	}
};
DrawingBoard.Control.Navigation = function(drawingBoard, opts) {
	this.board = drawingBoard || null;

	this.opts = $.extend({
		back: true,
		forward: true,
		reset: true
	}, opts);

	this.history = {
		values: [],
		position: 0
	};
	this.saveHistory();

	var el = '<div class="drawing-board-control drawing-board-control-navigation">';
	if (this.opts.back) el += '<button class="drawing-board-control-navigation-back">&larr;</button>';
	if (this.opts.forward) el += '<button class="drawing-board-control-navigation-forward">&rarr;</button>';
	if (this.opts.reset) el += '<button class="drawing-board-control-navigation-reset">×</button>';
	el += '</div>';
	this.$el = $(el);

	if (this.opts.back) {
		this.$el.on('click', '.drawing-board-control-navigation-back', $.proxy(function(e) {
			this.goBackInHistory();
			e.preventDefault();
		}, this));
	}

	if (this.opts.forward) {
		this.$el.on('click', '.drawing-board-control-navigation-forward', $.proxy(function(e) {
			this.goForthInHistory();
			e.preventDefault();
		}, this));
	}

	if (this.opts.reset) {
		this.$el.on('click', '.drawing-board-control-navigation-reset', $.proxy(function(e) {
			this.board.reset();
			e.preventDefault();
		}, this));
	}

	this.board.ev.bind('board:stopDrawing', $.proxy(function(e) { this.saveHistory(); }, this));
	this.board.ev.bind('board:reset', $.proxy(function(opts) { this.onBoardReset(opts); }, this));
};

DrawingBoard.Control.Navigation.prototype = {
	saveHistory: function () {
		while (this.history.values.length > 30) {
			this.history.values.shift();
		}
		if (this.history.position !== 0 && this.history.position !== this.history.values.length) {
			this.history.values = this.history.values.slice(0, this.history.position);
			this.history.position++;
		} else {
			this.history.position = this.history.values.length+1;
		}
		this.history.values.push(this.board.getImg());
	},

	_goThroughHistory: function(goForth) {
		if ((goForth && this.history.position == this.history.values.length) ||
			(!goForth && this.history.position == 1))
			return;
		var pos = goForth ? this.history.position+1 : this.history.position-1;
		if (this.history.values.length && this.history.values[pos-1] !== undefined) {
			this.history.position = pos;
			this.board.setImg(this.history.values[this.history.position-1]);
		}
		this.board.saveLocalStorage();
	},

	goBackInHistory: function() {
		this._goThroughHistory(false);
	},

	goForthInHistory: function() {
		this._goThroughHistory(true);
	},

	onBoardReset: function(opts) {
		if (opts.history)
			this.saveHistory();
	}
};
DrawingBoard.Control.Size = function(drawingBoard) {
	this.board = drawingBoard || null;
	var that = this;
	var tpl = '<div class="drawing-board-control drawing-board-control-size"><div class="drawing-board-control-inner">' +
		'<input type="range" min="1" max="50" value="' + this.board.opts.size + '" step="1" class="drawing-board-control-size-input">' +
		'<span class="drawing-board-control-size-label"></span>' +
		'</div></div>';

	this.$el = $(tpl);
	this.$el.on('change', 'input', function(e) {
		that.updateView($(this).val());
		e.preventDefault();
	});

	this.board.ev.bind('board:reset', $.proxy(function(opts) { this.onBoardReset(opts); }, this));
};

DrawingBoard.Control.Size.prototype = {
	onBoardReset: function(opts) {
		this.updateView(this.$el.find('input').val());
	},

	updateView: function(val) {
		this.board.ctx.lineWidth = val;
		this.$el.find('.drawing-board-control-size-label').css({
			width: val + 'px',
			height: val + 'px',
			borderRadius: val + 'px'
		});
	}
};
DrawingBoard.Control.Download = function(drawingBoard) {
	this.board = drawingBoard || null;

	var el = '<div class="drawing-board-control drawing-board-control-download">';
	el += '<button class="drawing-board-control-download-button">⤓</button>';
	el += '</div>';
	this.$el = $(el);
	this.$el.on('click', '.drawing-board-control-download-button', $.proxy(function(e) {
		this.board.downloadImg();
		e.preventDefault();
	}, this));
};