DrawingBoard.Control.Size = DrawingBoard.Control.extend({

	name: 'size',

	initialize: function() {
		var tpl = '<div class="drawing-board-control drawing-board-control-size"><div class="drawing-board-control-inner">' +
			'<input type="range" min="1" max="50" value="{{size}}" step="1" class="drawing-board-control-size-input">' +
			'<span class="drawing-board-control-size-label"></span>' +
			'</div></div>';

		this.$el.append( $( DrawingBoard.Utils.tpl(tpl, { size: this.board.opts.size }) ) );
		var that = this;
		this.$el.on('change', 'input', function(e) {
			that.updateView($(this).val());
			e.preventDefault();
		});
	},

	onBoardReset: function(opts) {
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
});