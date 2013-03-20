DrawingBoard.Control.Size = function(drawingBoard) {
	this.board = drawingBoard || null;
	var that = this;
	var tpl = '<div class="drawing-board-control drawing-board-control-size"><div class="drawing-board-control-inner">' +
		'<input type="range" min="1" max="50" value="10" class="drawing-board-control-size-input">' +
		'<span class="drawing-board-control-size-label"></span>' +
		'</div></div>';

	this.$el = $(tpl);
	this.$el.on('change', 'input', function(e) {
		that.updateView($(this).val());
		e.preventDefault();
	});
};

DrawingBoard.Control.Size.prototype = {
	reset: function() {
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