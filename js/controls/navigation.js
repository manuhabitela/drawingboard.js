DrawingBoard.Control.Navigation = DrawingBoard.Control.extend({

	name: 'navigation',

	opts: {
		back: true,
		forward: true,
		reset: true
	},

	initialize: function() {
		this.history = {
			values: [],
			position: 0
		};
		this.saveHistory();

		var el = '';
		if (this.opts.back) el += '<button class="drawing-board-control-navigation-back">&larr;</button>';
		if (this.opts.forward) el += '<button class="drawing-board-control-navigation-forward">&rarr;</button>';
		if (this.opts.reset) el += '<button class="drawing-board-control-navigation-reset">×</button>';
		this.$el.append(el);

		if (this.opts.back) {
			this.$el.on('click', '.drawing-board-control-navigation-back', $.proxy(function(e) {
				this.goBackInHistory();
				e.preventDefault();
			}, this));
		}

		if (this.opts.forward) {
			this.$el.on('click', '.drawing-board-control-navigation-forward', $.proxy(function(e) {
				this.goForthInHistory();
				e.preventDefault();
			}, this));
		}

		if (this.opts.reset) {
			this.$el.on('click', '.drawing-board-control-navigation-reset', $.proxy(function(e) {
				this.board.reset();
				e.preventDefault();
			}, this));
		}

		this.board.ev.bind('board:stopDrawing', $.proxy(function(e) { this.saveHistory(); }, this));
	},

	saveHistory: function () {
		while (this.history.values.length > 30) {
			this.history.values.shift();
		}
		if (this.history.position !== 0 && this.history.position !== this.history.values.length) {
			this.history.values = this.history.values.slice(0, this.history.position);
			this.history.position++;
		} else {
			this.history.position = this.history.values.length+1;
		}
		this.history.values.push(this.board.getImg());
	},

	_goThroughHistory: function(goForth) {
		if ((goForth && this.history.position == this.history.values.length) ||
			(!goForth && this.history.position == 1))
			return;
		var pos = goForth ? this.history.position+1 : this.history.position-1;
		if (this.history.values.length && this.history.values[pos-1] !== undefined) {
			this.history.position = pos;
			this.board.setImg(this.history.values[this.history.position-1]);
		}
		this.board.saveLocalStorage();
	},

	goBackInHistory: function() {
		this._goThroughHistory(false);
	},

	goForthInHistory: function() {
		this._goThroughHistory(true);
	},

	onBoardReset: function(opts) {
		if (opts.history)
			this.saveHistory();
	}
});