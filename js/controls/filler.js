DrawingBoard.Control.Filler = DrawingBoard.Control.extend({

	name: 'filler',

	initialize: function() {
		this.$el.append('<button class="drawing-board-control-filler-button"></button>');
		this.$el.on('click', '.drawing-board-control-filler-button', $.proxy(function(e) {
			this.board.downloadImg();
			e.preventDefault();
		}, this));

		this.board.ev.bind('board:startDrawing', $.proxy(this.fill, this));
	},

	/**
	 * Fills an area with the current stroke color.
	 */
	fill: function(e) {
		this.image = this.board.ctx.getImageData(0, 0, this.board.canvas.width, this.board.canvas.height);

		// constants identifying pixels components
		var INDEX = 0, X = 1, Y = 2, COLOR = 3;

		// target color components
		var stroke = this.board.ctx.strokeStyle;
		var r = parseInt(stroke.substr(1, 2), 16);
		var g = parseInt(stroke.substr(3, 2), 16);
		var b = parseInt(stroke.substr(5, 2), 16);

		// starting point
		var start = this.pixelAt(
			parseInt( e.coords.x, 10),
			parseInt( e.coords.y, 10)
		);

		// no need to continue if starting and target colors are the same
		if (start[COLOR] === this.pack(r, g, b)) {
			return;
		}

		// pixels to evaluate
		var queue = [start];

		// loop vars
		var pixel, x, y;
		var maxX = this.image.width - 1;
		var maxY = this.image.height - 1;

		while ((pixel = queue.pop())) {
			if (pixel[COLOR] === start[COLOR]) {
				this.image.data[pixel[INDEX]] = r;
				this.image.data[pixel[INDEX] + 1] = g;
				this.image.data[pixel[INDEX] + 2] = b;

				// west
				if (pixel[X] > 0) {
					queue.push(this.pixelAt(pixel[X] - 1, pixel[Y]));
				}

				// east
				if (pixel[X] < maxX) {
					queue.push(this.pixelAt(pixel[X] + 1, pixel[Y]));
				}

				// north
				if (pixel[Y] > 0) {
					queue.push(this.pixelAt(pixel[X], pixel[Y] - 1));
				}

				// south
				if (pixel[Y] < maxY) {
					queue.push(this.pixelAt(pixel[X], pixel[Y] + 1));
				}
			}
		}

		this.board.ctx.putImageData(this.image, 0, 0);
	},

	/**
	 * Returns informations on the pixel located at (x,y).
	 */
	pixelAt: function(x, y) {
		var i = (y * this.image.width + x) * 4;
		var c = this.pack(
			this.image.data[i],
			this.image.data[i + 1],
			this.image.data[i + 2]
		);

		return [
			i, // INDEX
			x, // X
			y, // Y
			c  // COLOR
		];
	},

	/**
	 * Packs an RGB color into a single integer.
	 */
	pack: function(r, g, b) {
		var c = 0;
		c |= (r & 255) << 16;
		c |= (g & 255) << 8;
		c |= (b & 255);
		return c;
	}
});
