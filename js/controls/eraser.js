DrawingBoard.Control.Eraser = DrawingBoard.Control.extend({

	name: 'eraser',

	initialize: function() {
		this.$el.append('<button class="drawing-board-control-eraser-button"></button>');
		this.$el.on('click', '.drawing-board-control-eraser-button', $.proxy(function(e) {
			if (this.board.backgroundColor) {
				this.board.ctx.strokeStyle = this.board.backgroundColor;
			} else {
				this.board.ctx.globalCompositeOperation = "destination-out";
			}
			e.preventDefault();
		}, this));
	}

});