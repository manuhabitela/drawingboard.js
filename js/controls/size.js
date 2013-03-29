DrawingBoard.Control.Size = DrawingBoard.Control.extend({

	name: 'size',

	defaults: {
		type: "list",
		list: [1, 3, 6, 10, 20, 30, 40, 50]
	},

	types: ['list', 'range'],

	initialize: function() {
		var tpl = $.inArray(this.opts.type, this.types) > -1 ? this['_' + this.opts.type + 'Template']() : false;
		if (!tpl) return false;

		this.val = this.board.opts.size;

		this.$el.append( $( tpl ) );
		this.$el.attr('data-drawing-board-type', this.opts.type);
		this.updateView();

		var that = this;

		if (this.opts.type == "range") {
			this.$el.on('change', '.drawing-board-control-size-input', function(e) {
				that.val = $(this).val();
				that.updateView();

				that.board.ev.trigger('size:changed', that.val);

				e.preventDefault();
			});
		}

		if (this.opts.type == "list") {
			this.$el.on('click', '.drawing-board-control-size-list-current', $.proxy(function(e) {
				this.$el.find('.drawing-board-control-size-list').toggleClass('drawing-board-utils-hidden');
			}, this));

			this.$el.on('click', '[data-size]', function(e) {
				that.val = parseInt($(this).attr('data-size'), 0);
				that.updateView();

				that.board.ev.trigger('size:changed', that.val);

				e.preventDefault();
			});
		}
	},

	_rangeTemplate: function() {
		var tpl = '<div class="drawing-board-control-inner">' +
			'<input type="range" min="1" max="50" value="{{size}}" step="1" class="drawing-board-control-size-input">' +
			'<span class="drawing-board-control-size-range-current"></span>' +
			'</div>';
		return DrawingBoard.Utils.tpl(tpl, { size: this.board.opts.size });
	},

	_listTemplate: function() {
		var tpl = '<div class="drawing-board-control-inner">' +
			'<div class="drawing-board-control-size-list-current"><span></span></div>' +
			'<ul class="drawing-board-control-size-list">';
		$.each(this.opts.list, function(i, size) {
			tpl += DrawingBoard.Utils.tpl(
				'<li data-size="{{size}}"><span style="width: {{size}}px; height: {{size}}px; border-radius: {{size}}px;"></span></li>',
				{ size: size }
			);
		});
		tpl += '</ul></div>';
		return tpl;
	},

	onBoardReset: function(opts) {
		this.updateView();
	},

	updateView: function() {
		var val = this.val;
		this.board.ctx.lineWidth = val;

		this.$el.find('.drawing-board-control-size-range-current, .drawing-board-control-size-list-current span').css({
			width: val + 'px',
			height: val + 'px',
			borderRadius: val + 'px',
			marginLeft: -1*val/2 + 'px',
			marginTop: -1*val/2 + 'px'
		});

		if (this.opts.type == 'list') {
			var closest = null;
			$.each(this.opts.list, function(i, size) {
				if (closest === null || Math.abs(size - val) < Math.abs(closest - val))
					closest = size;
			});
			this.$el.find('.drawing-board-control-size-list').addClass('drawing-board-utils-hidden');
		}
	}
});