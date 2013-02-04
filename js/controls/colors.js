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
		that.$el.find('.drawing-board-control-colors-current')
			.css('background-color', $(this).attr('data-color'))
			.attr('data-color', $(this).attr('data-color'));
		e.preventDefault();
	});

	this.$el.on('click', '.drawing-board-control-colors-current', function(e) {
		if (confirm("Remplir la feuille avec cette couleur ?")) {
			that.board.reset($(this).attr('data-color'));
		}
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