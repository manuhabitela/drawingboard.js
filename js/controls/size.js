DrawingBoard.Control.Size = DrawingBoard.Control.extend({

	name: 'size',

	defaults: {
		type: "auto",
		dropdownValues: [1, 3, 6, 10, 20, 30, 40, 50],
		min: 1,
		max: 50
	},

	types: ['dropdown', 'range'],

	initialize: function() {
		if (this.opts.type == "auto")
			this.opts.type = this._iHasRangeInput() ? 'range' : 'dropdown';
		var tpl = $.inArray(this.opts.type, this.types) > -1 ? this['_' + this.opts.type + 'Template']() : false;
		if (!tpl) return false;

		this.val = this.board.opts.size;

		this.$el.append( $( tpl ) );
		this.$el.attr('data-drawing-board-type', this.opts.type);
		this.updateView();

		var that = this;

		if (this.opts.type == "range") {
			this.$el.on('change', '.drawing-board-control-size-range-input', function(e) {
				that.val = $(this).val();
				that.updateView();

				that.board.ev.trigger('size:changed', that.val);

				e.preventDefault();
			});
		}

		if (this.opts.type == "dropdown") {
			this.$el.on('click', '.drawing-board-control-size-dropdown-current', $.proxy(function(e) {
				this.$el.find('.drawing-board-control-size-dropdown').toggleClass('drawing-board-utils-hidden');
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
		var tpl = '<div class="drawing-board-control-inner" title="{{size}}">' +
			'<input type="range" min="{{min}}" max="{{max}}" value="{{size}}" step="1" class="drawing-board-control-size-range-input">' +
			'<span class="drawing-board-control-size-range-current"></span>' +
			'</div>';
		return DrawingBoard.Utils.tpl(tpl, {
			min: this.opts.min,
			max: this.opts.max,
			size: this.board.opts.size
		});
	},

	_dropdownTemplate: function() {
		var tpl = '<div class="drawing-board-control-inner" title="{{size}}">' +
			'<div class="drawing-board-control-size-dropdown-current"><span></span></div>' +
			'<ul class="drawing-board-control-size-dropdown">';
		$.each(this.opts.dropdownValues, function(i, size) {
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

		this.$el.find('.drawing-board-control-size-range-current, .drawing-board-control-size-dropdown-current span').css({
			width: val + 'px',
			height: val + 'px',
			borderRadius: val + 'px',
			marginLeft: -1*val/2 + 'px',
			marginTop: -1*val/2 + 'px'
		});

		this.$el.find('.drawing-board-control-inner').attr('title', val);

		if (this.opts.type == 'dropdown') {
			var closest = null;
			$.each(this.opts.dropdownValues, function(i, size) {
				if (closest === null || Math.abs(size - val) < Math.abs(closest - val))
					closest = size;
			});
			this.$el.find('.drawing-board-control-size-dropdown').addClass('drawing-board-utils-hidden');
		}
	},

	_iHasRangeInput: function() {
		var inputElem  = document.createElement('input'),
			smile = ':)',
			docElement = document.documentElement,
			inputElemType = 'range',
			available;
		inputElem.setAttribute('type', inputElemType);
		available = inputElem.type !== 'text';
		inputElem.value         = smile;
		inputElem.style.cssText = 'position:absolute;visibility:hidden;';
		if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {
			docElement.appendChild(inputElem);
			defaultView = document.defaultView;
			available = defaultView.getComputedStyle &&
				defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
				(inputElem.offsetHeight !== 0);
			docElement.removeChild(inputElem);
		}
		return !!available;
	}
});