DrawingBoard.Control.Navigation = DrawingBoard.Control.extend({

	name: 'navigation',

	defaults: {
		back: true,
		forward: true,
		reset: true
	},

	initialize: function() {
		var el = '';
		if (this.opts.back) el += '<button class="drawing-board-control-navigation-back">&larr;</button>';
		if (this.opts.forward) el += '<button class="drawing-board-control-navigation-forward">&rarr;</button>';
		if (this.opts.reset) el += '<button class="drawing-board-control-navigation-reset">&times;</button>';
		this.$el.append(el);

		if (this.opts.back) {
			var $back = this.$el.find('.drawing-board-control-navigation-back');
			this.board.ev.bind('historyNavigation', $.proxy(this.updateBack, this, $back));
			this.$el.on('click', '.drawing-board-control-navigation-back', $.proxy(function(e) {
				this.board.goBackInHistory();
				e.preventDefault();
			}, this));

			this.updateBack($back);
		}

		if (this.opts.forward) {
			var $forward = this.$el.find('.drawing-board-control-navigation-forward');
			this.board.ev.bind('historyNavigation', $.proxy(this.updateForward, this, $forward));
			this.$el.on('click', '.drawing-board-control-navigation-forward', $.proxy(function(e) {
				this.board.goForthInHistory();
				e.preventDefault();
			}, this));

			this.updateForward($forward);
		}

		if (this.opts.reset) {
			this.$el.on('click', '.drawing-board-control-navigation-reset', $.proxy(function(e) {
				this.board.reset({ background: true });
				e.preventDefault();
			}, this));
		}
	},

	updateBack: function($back) {
		if (this.board.history.canUndo()) {
			$back.removeAttr('disabled');
		} else {
			$back.attr('disabled', 'disabled');
		}
	},

	updateForward: function($forward) {
		if (this.board.history.canRedo()) {
			$forward.removeAttr('disabled');
		} else {
			$forward.attr('disabled', 'disabled');
		}
	}
});