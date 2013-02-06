var DrawingBoard = function(selector, opts) {
	var that = this;
	var tpl = '<div class="drawing-board-controls"></div><canvas class="drawing-board-canvas" width={{width}} height={{height}}></canvas>';
	this.opts = $.extend({
		width: 600,
		height: 600,
		controls: ['Colors', 'Size', 'Navigation']
	}, opts);
	this.selector = selector;
	this.$el = $(this.selector);
	this.$el.addClass('drawing-board').css({ width: this.opts.width + 'px', height: this.opts.height + 'px'}).append( DrawingBoard.Utils.tpl(tpl, this.opts) );

	//mise en cache des éléments jQuery
	this.dom = {
		$canvas: this.$el.find('canvas'),
		$cursor: this.$el.find('.drawing-board-cursor'),
		$controls: this.$el.find('.drawing-board-controls')
	};
	this.canvas = this.dom.$canvas.get(0);
	this.ctx = this.canvas.getContext('2d');

	this.reset();

	this.initHistory();
	this.restoreLocalStorage();
	this.initDrawEvents();
	this.initControls();
};

DrawingBoard.prototype.reset = function(color) {
	color = color || "#ffffff";
	this.ctx.lineCap = "round";
	this.ctx.lineJoin = "round";
	this.ctx.save();
	this.ctx.fillStyle = color;
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.restore();
};

DrawingBoard.prototype.initHistory = function() {
	this.history = [];
};

DrawingBoard.prototype.saveHistory = function () {
	if (this.history === undefined) this.history = [];
	while (this.history.length > 30) {
		this.history.shift();
	}
	this.history.push(this.getImg());
};

DrawingBoard.prototype.goBackInHistory = function() {
	if (this.history.length)
		this.restoreImg(this.history.pop());
	this.saveLocalStorage();
};

DrawingBoard.prototype.restoreImg = function(src) {
	var that = this;
	img = new Image();
	img.onload = function () {
		that.ctx.drawImage(img, 0, 0);
	};
	img.src = src;
};

DrawingBoard.prototype.getImg = function() {
	return this.canvas.toDataURL("image/png");
};

DrawingBoard.prototype.restoreLocalStorage = function() {
	if (window.localStorage && localStorage.getItem('drawing-board-image') !== null) {
		this.restoreImg(localStorage.getItem('drawing-board-image'));
	}
};

DrawingBoard.prototype.saveLocalStorage = function() {
	if (window.localStorage) {
		localStorage.setItem('drawing-board-image', this.getImg());
	}
};

DrawingBoard.prototype.initDrawEvents = function() {
	var that = this;
	this.isDrawing = false;
	this.coords = {};
	this.coords.old = this.coords.current = this.coords.oldMid = { x: null, y: null };

	this.dom.$canvas.on('mousedown touchstart', function(e) {
		that._onInputStart(e, that._getInputCoords(e) );
	});

	this.dom.$canvas.on('mousemove touchmove', function(e) {
		that._onInputMove(e, that._getInputCoords(e) );
	});

	this.dom.$canvas.on('mousemove', function(e) {

	});

	this.dom.$canvas.on('mouseup touchend', function(e) {
		that._onInputStop(e, that._getInputCoords(e) );
	});

	this.dom.$canvas.on('mouseover', function(e) {
		that._onMouseOver(e, that._getInputCoords(e) );
	});

	this.dom.$canvas.on('mouseout', function(e) {

	});
	requestAnimationFrame( $.proxy(function() { this.draw(); }, this) );
};

DrawingBoard.prototype.draw = function() {
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
};

DrawingBoard.prototype._onInputStart = function(e, coords) {
	this.coords.old = coords;
	this.coords.oldMid = this._getMidInputCoords(coords);
	this.isDrawing = true;

	e.preventDefault();
};

DrawingBoard.prototype._onInputMove = function(e, coords) {
	this.coords.current = coords;

	e.preventDefault();
};

DrawingBoard.prototype._onInputStop = function(e, coords) {
	if (this.isDrawing && (!e.touches || e.touches.length === 0)) {
		this.isDrawing = false;
		this.saveHistory();
		this.saveLocalStorage();

		e.preventDefault();
	}
};

DrawingBoard.prototype._onMouseOver = function(e, coords) {
	this.coords.old = this._getInputCoords(e);
	this.coords.oldMid = this._getMidInputCoords(this.coords.old);
	if (e.which !== 1)
		this.isDrawing = false;
};

DrawingBoard.prototype._getInputCoords = function(e) {
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
};

DrawingBoard.prototype._getMidInputCoords = function(coords) {
	return {
		x: this.coords.old.x + coords.x>>1,
		y: this.coords.old.y + coords.y>>1
	};
};

DrawingBoard.prototype.initControls = function() {
	for (var i = 0; i < this.opts.controls.length; i++) {
		var c = new window['DrawingBoard']['Control'][this.opts.controls[i]](this);
		this.addControl(c);
	}
};

DrawingBoard.prototype.addControl = function(control) {
	this.dom.$controls.append(control.$el);
};

DrawingBoard.Control = {};