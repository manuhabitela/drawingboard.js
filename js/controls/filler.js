DrawingBoard.Control.Filler = DrawingBoard.Control.extend({

	name: 'filler',
	tolerance: 0,

	initialize: function() {
		this.$el.append('<button class="drawing-board-control-filler-button"></button>');
		this.$el.on('click', '.drawing-board-control-filler-button', $.proxy(function(e) {
			this.board.downloadImg();
			e.preventDefault();
		}, this));

		this.board.ev.bind('board:startDrawing', $.proxy(this.fill, this));
	},
//http://beej.us/blog/data/html5s-canvas-2-pixel/
	fill: function(e) {
		var data = this.board.ctx.getImageData(0, 0, this.board.canvas.width, this.board.canvas.height);
		console.log(data);
		var current = undefined;
		var queue = [];
		var visited = [];
		var start = this.pixelAt(data.coords.x, data.coords.y);

		var x = e.coords.x, e.coords.y = 0;
		var pos = (x + y * data.width) * 4;

		console.log(this.board.ctx.strokeStyle());

		while (current = queue.pop()) {
			if (compare(start.data, current.data)) {
				this.board.ctx.fillRect(current.coords)
			}
		}
	},

	pixelAt: function(data,x,y) {
		var data = this.board.ctx.getImageData(data.coords.x,data.coords.y,1,1).data;

		return {
			x: x,
			y: y,
			r: data[0],
			g: data[1],
			b: data[2]
		}
	},

	hash: function(coords) {
		return coords.x * 65535 + coords.y;
	},

	compare: function(x,y,color) {
		return (one.r === two.r) && (one.g === two.g) && (one.b === two.b);
	}

});
