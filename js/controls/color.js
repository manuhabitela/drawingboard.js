DrawingBoard.Control.Color = DrawingBoard.Control.extend({
	name: 'colors',

	defaults: {
		compact: true
	},

	initialize: function() {
		this.initTemplate();

		var that = this;
		this.$el.on('click', '.drawing-board-control-colors-picker', function(e) {
			that.board.ctx.strokeStyle = $(this).attr('data-color');
			that.$el.find('.drawing-board-control-colors-current')
				.css('background-color', $(this).attr('data-color'))
				.attr('data-color', $(this).attr('data-color'));
			if (that.opts.compact) {
				that.$el.find('.drawing-board-control-colors-rainbows').addClass('drawing-board-utils-hidden');
			}

			that.board.ev.trigger('color:changed', $(this).attr('data-color'));

			e.preventDefault();
		});

		this.$el.on('click', '.drawing-board-control-colors-current', function(e) {
			if (that.opts.compact) {
				that.$el.find('.drawing-board-control-colors-rainbows').toggleClass('drawing-board-utils-hidden');
			} else {
				that.board.reset({ background: $(this).attr('data-color') });
			}
			e.preventDefault();
		});
	},

	initTemplate: function() {
		var tpl = '<div class="drawing-board-control-inner">' +
			'<div class="drawing-board-control-colors-current" style="background-color: {{color}}" data-color="{{color}}"></div>' +
			'<div class="drawing-board-control-colors-rainbows">{{rainbows}}</div>' +
			'</div>';
		var oneColorTpl = '<div class="drawing-board-control-colors-picker" data-color="{{color}}" style="background-color: {{color}}"></div>';
		var rainbows = '';
		$.each([0.75, 0.5, 0.25], $.proxy(function(key, val) {
			var i = 0;
			var additionalColor = null;
			rainbows += '<div class="drawing-board-control-colors-rainbow">';
			if (val == 0.25) additionalColor = this._rgba(0, 0, 0, 1);
			if (val == 0.5) additionalColor = this._rgba(150, 150, 150, 1);
			if (val == 0.75) additionalColor = this._rgba(255, 255, 255, 1);
			rainbows += DrawingBoard.Utils.tpl(oneColorTpl, {color: additionalColor.toString() });
			while (i <= 330) {
				rainbows += DrawingBoard.Utils.tpl(oneColorTpl, {color: this._hsl2Rgba(this._hsl(i-60, 1, val)).toString() });
				i+=30;
			}
			rainbows += '</div>';
		}, this));

		this.$el.append( $( DrawingBoard.Utils.tpl(tpl, {color: this.board.ctx.strokeStyle, rainbows: rainbows }) ) );
		if (this.opts.compact) {
			this.$el.find('.drawing-board-control-colors-rainbows').addClass('drawing-board-utils-hidden');
			this.$el.attr('data-drawing-board-compact', "1");
		}
	},

	onBoardReset: function(opts) {
		this.board.ctx.strokeStyle = this.$el.find('.drawing-board-control-colors-current').attr('data-color');
	},

	_rgba: function(r, g, b, a) {
		return { r: r, g: g, b: b, a: a, toString: function() { return "rgba(" + r +", " + g + ", " + b + ", " + a + ")"; } };
	},

	_hsl: function(h, s, l) {
		return { h: h, s: s, l: l, toString: function() { return "hsl(" + h +", " + s*100 + "%, " + l*100 + "%)"; } };
	},

	_hex2Rgba: function(hex) {
		var num = parseInt(hex.substring(1), 16);
		return this._rgba(num >> 16, num >> 8 & 255, num & 255, 1);
	},

	//conversion function (modified a bit) taken from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
	_hsl2Rgba: function(hsl) {
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
		return this._rgba(r, g, b, 1);
	}
});