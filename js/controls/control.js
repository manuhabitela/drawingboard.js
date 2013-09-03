DrawingBoard.Control = function(drawingBoard, opts) {
	this.board = drawingBoard;
	this.opts = $.extend({}, this.defaults, opts);

	this.$el = $(document.createElement('div')).addClass('drawing-board-control');
	if (this.name)
		this.$el.addClass('drawing-board-control-' + this.name);

	this.board.ev.bind('board:reset', $.proxy(this.onBoardReset, this));

	this.initialize.apply(this, arguments);
	return this;
};

DrawingBoard.Control.prototype = {

	name: '',

	defaults: {},

	initialize: function() {

	},

	addToBoard: function() {
		this.board.addControl(this);
	},

	onBoardReset: function(opts) {

	}

};

//extend directly taken from backbone.js
DrawingBoard.Control.extend = function(protoProps, staticProps) {
	var parent = this;
	var child;
	if (protoProps && protoProps.hasOwnProperty('constructor')) {
		child = protoProps.constructor;
	} else {
		child = function(){ return parent.apply(this, arguments); };
	}
	$.extend(child, parent, staticProps);
	var Surrogate = function(){ this.constructor = child; };
	Surrogate.prototype = parent.prototype;
	child.prototype = new Surrogate();
	if (protoProps) $.extend(child.prototype, protoProps);
	child.__super__ = parent.prototype;
	return child;
};