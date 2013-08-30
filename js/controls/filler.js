DrawingBoard.Control.Filler = DrawingBoard.Control.extend({

	name: 'filler',
	tolerance: 0,

	initialize: function() {
		this.$el.append('<button class="drawing-board-control-filler-button"></button>');
		this.$el.on('click', '.drawing-board-control-filler-button', $.proxy(function(e) {
			this.board.downloadImg();
			e.preventDefault();
		}, this));

		this.board.ev.bind('board:stopDrawing', $.proxy(this.fill, this));
	},
//http://beej.us/blog/data/html5s-canvas-2-pixel/
	fill: function(e) {console.log('fill');
		this.image = this.board.ctx.getImageData(0, 0, this.board.canvas.width, this.board.canvas.height);
		var origin = this.pixelAt(e.coords.x, e.coords.y);
		var target = {
			r: 128,
			g: 0,
			b: 0,
			a: 255
		};

		if (this.compare(origin, target)) {
			return;
		}

		var queue = [origin];
		var current, x, y, a=10;

		while (current = queue.pop()) {
			if (this.compare(current, origin)) {
				this.colorize({
					x: current.x,
					y: current.y,
					r: target.r,
					g: target.g,
					b: target.b,
					a: target.a
				});

				for (x = current.x - 1; x != current.x + 1; x += 2) {
					console.log(x,y);
					for (y = current.y - 1; y != current.y + 1; y += 2) {
						console.log(x,y);
						if (x >= 0 && x < this.image.width && y >= 0 && y < this.image.height) {
							queue.push(this.pixelAt(x, y));
						}
					}
				}
			}

			if (--a < 0) {
				//break;
			}
		}

		this.board.ctx.clearRect(0, 0, this.board.canvas.width, this.board.canvas.height);
		this.board.ctx.putImageData(this.image, 0, 0);
	},

	pixelAt: function(x, y) {
		var i = (y * this.image.width + x) * 4;

		return {
			x: x,
			y: y,
			r: this.image.data[i],
			g: this.image.data[i + 1],
			b: this.image.data[i + 2],
			a: this.image.data[i + 3]
		};
	},

	colorize: function(pixel) {
		var i = (pixel.y * this.image.width + pixel.x) * 4;

		this.image.data[i] = pixel.r;
		this.image.data[i + 1] = pixel.g;
		this.image.data[i + 2] = pixel.b;
		this.image.data[i + 3] = pixel.a;
	},

	compare: function(pixel,other) {
		return (pixel.r === other.r)
			&& (pixel.g === other.g)
			&& (pixel.b === other.b)
			&& (pixel.a === other.a);
	}

});
