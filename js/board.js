/**
 * pass the id of the html element to put the drawing board into
 * and some options : {
 *	controls: array of controls to initialize with the drawingboard. 'Colors', 'Size', and 'Navigation' by default
 *	background: background of the drawing board. Give a hex color or an image url "#ffffff" (white) by default
 *	localStorage: true or false (true by default). If true, store the current drawing in localstorage and restore it when you come back
 * }
 */
DrawingBoard.Board = function(id, opts) {
	var tpl = '<div class="drawing-board-controls"></div><div class="drawing-board-canvas-wrapper"><canvas class="drawing-board-canvas"></canvas><div class="drawing-board-cursor hidden"></div></div>';

	this.opts = $.extend({
		controls: ['Colors', 'Size', 'Navigation'],
		localStorage: true
		background: "#ffffff",
		color: "#000000",
		size: 3
	}, opts);

	this.ev = new DrawingBoard.Utils.MicroEvent();

	this.id = id;
	this.$el = $(document.getElementById(id));
	if (!this.$el.length)
		return false;

	this.$el.addClass('drawing-board').append(tpl);
	this.dom = {
		$canvasWrapper: this.$el.find('.drawing-board-canvas-wrapper'),
		$canvas: this.$el.find('.drawing-board-canvas'),
		$cursor: this.$el.find('.drawing-board-cursor'),
		$controls: this.$el.find('.drawing-board-controls')
	};

	this.canvas = this.dom.$canvas.get(0);
	this.ctx = this.canvas.getContext('2d');

	this.initControls();
	this.reset({ localStorage: false });
	this.restoreLocalStorage();
	this.initDrawEvents();
};


DrawingBoard.Board.prototype = {

	/**
	 * reset the drawing board and its controls
	 * - recalculates canvas size
	 * - change background based on default one or given one in the opts object
	 * - store the reseted drawing board in localstorage if opts.localStorage is true (it is by default)
	 */
	reset: function(opts) {
		opts = $.extend({
			background: this.opts.background,
			color: this.opts.color,
			size: this.opts.size,
			history: true,
			localStorage: true
		}, opts);

		//I know.
		var width = this.$el.width() -
			DrawingBoard.Utils.elementBorderWidth(this.$el) -
			DrawingBoard.Utils.elementBorderWidth(this.dom.$canvasWrapper, true, true);
		var height = this.$el.height() -
			DrawingBoard.Utils.elementBorderHeight(this.$el) -
			this.dom.$controls.height() -
			DrawingBoard.Utils.elementBorderHeight(this.dom.$controls, false, true) -
			parseInt(this.dom.$controls.css('margin-bottom').replace('px', ''), 10) -
			DrawingBoard.Utils.elementBorderHeight(this.dom.$canvasWrapper);
		this.dom.$canvasWrapper.css('width', width + 'px');
		this.dom.$canvasWrapper.css('height', height + 'px');
		this.canvas.width = width;
		this.canvas.height = height;

		this.ctx.strokeStyle = opts.color;
		this.ctx.lineWidth = opts.size;
		this.ctx.lineCap = "round";
		this.ctx.lineJoin = "round";
		this.ctx.save();
			this.ctx.fillStyle = opts.background;
		this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.restore();

		if (opts.localStorage) this.saveLocalStorage();

		this.ev.trigger('board:reset', opts);
	},



	/**
	 * Controls:
	 * the drawing board can has various UI elements to control it.
	 * one control is represented by a class in the namespace DrawingBoard.Control
	 * it must have a $el property (jQuery object), representing the html element to append on the drawing board at initialization.
	 * if it has a reset method, it will be called by the reset method of the drawing board
	 *
	 * An example control is given in controls/example.js.
	 */

	initControls: function() {
		this.controls = [];
		for (var i = 0; i < this.opts.controls.length; i++) {
			var c = new window['DrawingBoard']['Control'][this.opts.controls[i]](this);
			this.controls.push(c);
			this.addControl(c);
		}
	},

	addControl: function(control) {
		if (!control.board)
			control.board = this;
		if (!this.controls)
			this.controls = [];
		this.controls.push(control);
		this.dom.$controls.append(control.$el);
	},



	/**
	 * Image methods: you can directly put an image on the canvas, get it in base64 data url or start a download
	 */

	restoreImg: function(src) {
		img = new Image();
		img.onload = $.proxy(function() {
			this.ctx.drawImage(img, 0, 0);
		}, this);
		img.src = src;
	},

	getImg: function() {
		return this.canvas.toDataURL("image/png");
	},

	downloadImg: function() {
		var img = this.getImg();
		img = img.replace("image/png", "image/octet-stream");
		window.location.href = img;
	},



	/**
	 * localStorage handling : save and restore
	 */

	restoreLocalStorage: function() {
		if (this.opts.localStorage && window.localStorage && localStorage.getItem('drawing-board-image-' + this.id) !== null) {
			this.restoreImg(localStorage.getItem('drawing-board-image-' + this.id));
			this.ev.trigger('board:restoreLocalStorage', localStorage.getItem('drawing-board-image-' + this.id));
		}
	},

	saveLocalStorage: function() {
		if (this.opts.localStorage && window.localStorage) {
			localStorage.setItem('drawing-board-image-' + this.id, this.getImg());
			this.ev.trigger('board:saveLocalStorage', this.getImg());
		}
	},



	/**
	 * Drawing handling, with mouse or touch
	 */

	initDrawEvents: function() {
		this.isDrawing = false;
		this.isMouseHovering = false;
		this.coords = {};
		this.coords.old = this.coords.current = this.coords.oldMid = { x: 0, y: 0 };

		this.dom.$canvas.on('mousedown touchstart', $.proxy(function(e) {
			this._onInputStart(e, this._getInputCoords(e) );
		}, this));

		this.dom.$canvas.on('mousemove touchmove', $.proxy(function(e) {
			this._onInputMove(e, this._getInputCoords(e) );
		}, this));

		this.dom.$canvas.on('mousemove', $.proxy(function(e) {

		}, this));

		this.dom.$canvas.on('mouseup touchend', $.proxy(function(e) {
			this._onInputStop(e, this._getInputCoords(e) );
		}, this));

		this.dom.$canvas.on('mouseover', $.proxy(function(e) {
			this._onMouseOver(e, this._getInputCoords(e) );
		}, this));

		this.dom.$canvas.on('mouseout', $.proxy(function(e) {
			this._onMouseOut(e, this._getInputCoords(e) );

		}, this));
		requestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
	},

	draw: function() {
		//if the pencil size is big (>10), the small crosshair makes a friend: a circle of the size of the pencil
		if (this.ctx.lineWidth > 10 && this.isMouseHovering) {
			this.dom.$cursor.css({ width: this.ctx.lineWidth + 'px', height: this.ctx.lineWidth + 'px' });
			var transform = DrawingBoard.Utils.tpl("translateX({{x}}px) translateY({{y}}px)", { x: this.coords.current.x-(this.ctx.lineWidth/2), y: this.coords.current.y-(this.ctx.lineWidth/2) });
			this.dom.$cursor.css({ 'transform': transform, '-webkit-transform': transform, '-ms-transform': transform });
			this.dom.$cursor.removeClass('drawing-board-utils-hidden');
		} else {
			this.dom.$cursor.addClass('drawing-board-utils-hidden');
		}

		if (this.isDrawing) {
			var currentMid = this._getMidInputCoords(this.coords.current);
			this.ctx.beginPath();
			this.ctx.moveTo(currentMid.x, currentMid.y);
			this.ctx.quadraticCurveTo(this.coords.old.x, this.coords.old.y, this.coords.oldMid.x, this.coords.oldMid.y);
			this.ctx.stroke();

			this.coords.old = this.coords.current;
			this.coords.oldMid = currentMid;
		}

		requestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
	},

	_onInputStart: function(e, coords) {
		this.coords.current = this.coords.old = coords;
		this.coords.oldMid = this._getMidInputCoords(coords);
		this.isDrawing = true;

		this.ev.trigger('board:startDrawing', {e: e, coords: coords});
		e.preventDefault();
	},

	_onInputMove: function(e, coords) {
		this.coords.current = coords;

		this.ev.trigger('board:drawing', {e: e, coords: coords});
		e.preventDefault();
	},

	_onInputStop: function(e, coords) {
		if (this.isDrawing && (!e.touches || e.touches.length === 0)) {
			this.isDrawing = false;

			this.saveLocalStorage();

			this.ev.trigger('board:stopDrawing', {e: e, coords: coords});
			e.preventDefault();
		}
	},

	_onMouseOver: function(e, coords) {
		this.isMouseHovering = true;
		this.coords.old = this._getInputCoords(e);
		this.coords.oldMid = this._getMidInputCoords(this.coords.old);
		if (e.which !== 1)
			this.isDrawing = false;

		this.ev.trigger('board:mouseOver', {e: e, coords: coords});
	},

	_onMouseOut: function(e, coords) {
		this.isMouseHovering = false;

		this.ev.trigger('board:mouseOut', {e: e, coords: coords});
	},

	_getInputCoords: function(e) {
		var x, y;
		if (e.touches && e.touches.length == 1) {
			x = e.touches[0].pageX;
			y = e.touches[0].pageY;
		} else {
			x = e.pageX;
			y = e.pageY;
		}
		return {
			x: x - this.dom.$canvas.offset().left,
			y: y - this.dom.$canvas.offset().top
		};
	},

	_getMidInputCoords: function(coords) {
		return {
			x: this.coords.old.x + coords.x>>1,
			y: this.coords.old.y + coords.y>>1
		};
	}
};