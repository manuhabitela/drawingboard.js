DrawingBoard.Control.DrawingMode = DrawingBoard.Control.extend({

	name: 'drawingmode',

	defaults: {
		pencil: true,
		eraser: true,
		filler: true
	},

	initialize: function() {

		this.prevMode = this.board.getMode();

		$.each(["pencil", "eraser", "filler"], $.proxy(function(k, value) {
			if (this.opts[value]) {
				this.$el.append('<button class="drawing-board-control-drawingmode-' + value + '-button" data-mode="' + value + '"></button>');
			}
		}, this));

		this.$el.on('click', 'button[data-mode]', $.proxy(function(e) {
			var value = $(e.currentTarget).attr('data-mode');
			var mode = this.board.getMode();
			if (mode !== value) this.prevMode = mode;
			var newMode = mode === value ? this.prevMode : value;
			this.board.setMode( newMode );
			e.preventDefault();
		}, this));

		this.board.ev.bind('board:mode', $.proxy(function(mode) {
			this.toggleButtons(mode);
		}, this));

		this.toggleButtons( this.board.getMode() );
	},

	toggleButtons: function(mode) {
		this.$el.find('button[data-mode]').each(function(k, item) {
			var $item = $(item);
			$item.toggleClass('active', mode === $item.attr('data-mode'));
		});
	}

});
