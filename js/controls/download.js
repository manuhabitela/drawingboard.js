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