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
			//that.board.goForwardInHistory();
			e.preventDefault();
		});
	}

	if (this.opts.resetButton) {
		this.$el.on('click', '.drawing-board-control-navigation-reset', function(e) {
			that.board.reset();
			that.board.saveLocalStorage();
			e.preventDefault();
		});
	}
};