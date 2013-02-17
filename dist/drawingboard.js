var DrawingBoard = function(id, opts) {
	var that = this;
	var tpl = '<div class="drawing-board-controls"></div><div class="drawing-board-canvas-wrapper"><canvas class="drawing-board-canvas"></canvas><div class="drawing-board-cursor hidden"></div></div>';
	this.opts = $.extend({
		controls: ['Colors', 'Size', 'Navigation'],
		defaultBgColor: "#ffffff",
		localStorage: true
	}, opts);
	this.$el = $(document.getElementById(id));
	if (!this.$el.length)
		return false;
	this.$el.addClass('drawing-board').append( DrawingBoard.Utils.tpl(tpl, this.opts) );
	this.dom = {
		$canvas: this.$el.find('canvas'),
		$cursor: this.$el.find('.drawing-board-cursor'),
		$controls: this.$el.find('.drawing-board-controls')
	};
	this.canvas = this.dom.$canvas.get(0);
	this.ctx = this.canvas.getContext('2d');

	this.initControls();
	this.reset({ history: false, localStorage: false });
	this.initHistory();
	this.restoreLocalStorage();
	this.initDrawEvents();

	$(window).on('resize', function(e) {
		that._updateSize();
	});
};

DrawingBoard.prototype._updateSize = function() {
	this.canvas.width = this.$el.width();
	this.canvas.height = this.$el.height() - this.dom.$controls.height();
};

DrawingBoard.prototype.reset = function(opts) {
	opts = $.extend({
		color: this.opts.defaultBgColor,
		history: true,
		localStorage: true
	}, opts);
	this._updateSize();
	this.ctx.lineCap = "round";
	this.ctx.lineJoin = "round";
	this.ctx.save();
	this.ctx.fillStyle = opts.color;
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.restore();

	if (opts.history) this.saveHistory();
	if (opts.localStorage) this.saveLocalStorage();
};

DrawingBoard.prototype.initHistory = function() {
	this.history = {
		values: [],
		position: 0
	};
	this.saveHistory();
};

DrawingBoard.prototype.saveHistory = function () {
	while (this.history.values.length > 30) {
		this.history.values.shift();
	}
	if (this.history.position !== 0 && this.history.position !== this.history.values.length) {
		this.history.values = this.history.values.slice(0, this.history.position);
		this.history.position++;
	} else {
		this.history.position = this.history.values.length+1;
	}
	this.history.values.push(this.getImg());
};

DrawingBoard.prototype._goThroughHistory = function(goForth) {
	if ((goForth && this.history.position == this.history.values.length) ||
		(!goForth && this.history.position == 1))
		return;
	var pos = goForth ? this.history.position+1 : this.history.position-1;
	if (this.history.values.length && this.history.values[pos-1] !== undefined) {
		this.history.position = pos;
		this.restoreImg(this.history.values[this.history.position-1]);
	}
	this.saveLocalStorage();
};

DrawingBoard.prototype.goBackInHistory = function() {
	this._goThroughHistory(false);
};

DrawingBoard.prototype.goForthInHistory = function() {
	this._goThroughHistory(true);
};

DrawingBoard.prototype.restoreImg = function(src) {
	var that = this;
	img = new Image();
	img.onload = function () {
		that.ctx.drawImage(img, 0, 0);
	};
	img.src = src;
};

DrawingBoard.prototype.getImg = function() {
	return this.canvas.toDataURL("image/png");
};

DrawingBoard.prototype.restoreLocalStorage = function() {
	if (this.opts.localStorage && window.localStorage && localStorage.getItem('drawing-board-image') !== null) {
		this.restoreImg(localStorage.getItem('drawing-board-image'));
	}
};

DrawingBoard.prototype.saveLocalStorage = function() {
	if (this.opts.localStorage && window.localStorage) {
		localStorage.setItem('drawing-board-image', this.getImg());
	}
};

DrawingBoard.prototype.initDrawEvents = function() {
	var that = this;
	this.isDrawing = false;
	this.coords = {};
	this.coords.old = this.coords.current = this.coords.oldMid = { x: 0, y: 0 };

	this.dom.$canvas.on('mousedown touchstart', function(e) {
		that._onInputStart(e, that._getInputCoords(e) );
	});

	this.dom.$canvas.on('mousemove touchmove', function(e) {
		that._onInputMove(e, that._getInputCoords(e) );
	});

	this.dom.$canvas.on('mousemove', function(e) {

	});

	this.dom.$canvas.on('mouseup touchend', function(e) {
		that._onInputStop(e, that._getInputCoords(e) );
	});

	this.dom.$canvas.on('mouseover', function(e) {
		that._onMouseOver(e, that._getInputCoords(e) );
	});

	this.dom.$canvas.on('mouseout', function(e) {

	});
	requestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
};

DrawingBoard.prototype.draw = function() {
	if (this.ctx.lineWidth > 10 && this.dom.$canvas.is(':hover')) {
		this.dom.$cursor.css({ width: this.ctx.lineWidth + 'px', height: this.ctx.lineWidth + 'px' });
		var transform = DrawingBoard.Utils.tpl("translateX({{x}}px) translateY({{y}}px)", { x: this.coords.current.x-(this.ctx.lineWidth/2), y: this.coords.current.y-(this.ctx.lineWidth/2) });
		this.dom.$cursor.css({ 'transform': transform, '-webkit-transform': transform, '-ms-transform': transform });
		this.dom.$cursor.removeClass('drawing-board-utils-hidden');
	} else {
		this.dom.$canvas.css('cursor', 'crosshair');
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
};

DrawingBoard.prototype._onInputStart = function(e, coords) {
	this.coords.current = this.coords.old = coords;
	this.coords.oldMid = this._getMidInputCoords(coords);
	this.isDrawing = true;

	e.preventDefault();
};

DrawingBoard.prototype._onInputMove = function(e, coords) {
	this.coords.current = coords;

	e.preventDefault();
};

DrawingBoard.prototype._onInputStop = function(e, coords) {
	if (this.isDrawing && (!e.touches || e.touches.length === 0)) {
		this.isDrawing = false;
		this.saveHistory();
		this.saveLocalStorage();

		e.preventDefault();
	}
};

DrawingBoard.prototype._onMouseOver = function(e, coords) {
	this.coords.old = this._getInputCoords(e);
	this.coords.oldMid = this._getMidInputCoords(this.coords.old);
	if (e.which !== 1)
		this.isDrawing = false;
};

DrawingBoard.prototype._getInputCoords = function(e) {
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
};

DrawingBoard.prototype._getMidInputCoords = function(coords) {
	return {
		x: this.coords.old.x + coords.x>>1,
		y: this.coords.old.y + coords.y>>1
	};
};

DrawingBoard.prototype.initControls = function() {
	for (var i = 0; i < this.opts.controls.length; i++) {
		var c = new window['DrawingBoard']['Control'][this.opts.controls[i]](this);
		this.addControl(c);
	}
};

DrawingBoard.prototype.addControl = function(control) {
	this.dom.$controls.append(control.$el);
};

DrawingBoard.Control = {};
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
DrawingBoard.Control.Colors = function(drawingBoard, opts) {
	this.board = drawingBoard;
	this.opts = $.extend({
		defaultColor: "rgba(0, 0, 0, 1)"
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
		that.$el.find('.drawing-board-control-colors-current')
			.css('background-color', $(this).attr('data-color'))
			.attr('data-color', $(this).attr('data-color'));
		e.preventDefault();
	});

	this.$el.on('click', '.drawing-board-control-colors-current', function(e) {
		that.board.reset({ color: $(this).attr('data-color') });
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
			this.el += DrawingBoard.Utils.tpl(oneColorTpl, {color: additionalColor.toString() });
		while (i <= 330) {
			this.el += DrawingBoard.Utils.tpl(oneColorTpl, {color: this.hsl2Rgba(this.hsl(i-60, 1, l)).toString() });
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
			that.board.goForthInHistory();
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