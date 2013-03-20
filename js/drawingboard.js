var DrawingBoard = function(id, opts) {
	var that = this;
	var tpl = '<div class="drawing-board-controls"></div><div class="drawing-board-canvas-wrapper"><canvas class="drawing-board-canvas"></canvas><div class="drawing-board-cursor hidden"></div></div>';
	this.opts = $.extend({
		controls: ['Colors', 'Size', 'Navigation'],
		defaultBgColor: "#ffffff",
		localStorage: true
	}, opts);
	this.$el = $(document.getElementById(id));
	if (!this.$el.length)
		return false;
	this.$el.addClass('drawing-board').append( DrawingBoard.Utils.tpl(tpl, this.opts) );
	this.dom = {
		$canvasWrapper: this.$el.find('.drawing-board-canvas-wrapper'),
		$canvas: this.$el.find('canvas'),
		$cursor: this.$el.find('.drawing-board-cursor'),
		$controls: this.$el.find('.drawing-board-controls')
	};
	this.canvas = this.dom.$canvas.get(0);
	this.ctx = this.canvas.getContext('2d');

	this.initControls();
	this.reset({ history: false, localStorage: false });
	this.initHistory();
	this.restoreLocalStorage();
	this.initDrawEvents();
};

DrawingBoard.prototype.reset = function(opts) {
	opts = $.extend({
		color: this.opts.defaultBgColor,
		history: true,
		localStorage: true
	}, opts);
	//I know.
	var width = this.$el.width()
		- DrawingBoard.Utils.elementBorderWidth(this.$el)
		- DrawingBoard.Utils.elementBorderWidth(this.dom.$canvasWrapper, true, true);
	var height = this.$el.height()
		- DrawingBoard.Utils.elementBorderHeight(this.$el)
		- this.dom.$controls.height()
		- DrawingBoard.Utils.elementBorderHeight(this.dom.$controls, false, true)
		- parseInt(this.dom.$controls.css('margin-bottom').replace('px', ''), 10)
		- DrawingBoard.Utils.elementBorderHeight(this.dom.$canvasWrapper);
	this.dom.$canvasWrapper.css('width', width + 'px');
	this.dom.$canvasWrapper.css('height', height + 'px');
	this.canvas.width = width;
	this.canvas.height = height;
	this.ctx.lineCap = "round";
	this.ctx.lineJoin = "round";
	this.ctx.save();
	this.ctx.fillStyle = opts.color;
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.restore();

	if (opts.history) this.saveHistory();
	if (opts.localStorage) this.saveLocalStorage();
	if (this.controls) {
		for (var i = this.controls.length - 1; i >= 0; i--) {
			if (typeof this.controls[i].reset == "function") {
				this.controls[i].reset();
			}
		}
	}
};

DrawingBoard.prototype.initHistory = function() {
	this.history = {
		values: [],
		position: 0
	};
	this.saveHistory();
};

DrawingBoard.prototype.saveHistory = function () {
	while (this.history.values.length > 30) {
		this.history.values.shift();
	}
	if (this.history.position !== 0 && this.history.position !== this.history.values.length) {
		this.history.values = this.history.values.slice(0, this.history.position);
		this.history.position++;
	} else {
		this.history.position = this.history.values.length+1;
	}
	this.history.values.push(this.getImg());
};

DrawingBoard.prototype._goThroughHistory = function(goForth) {
	if ((goForth && this.history.position == this.history.values.length) ||
		(!goForth && this.history.position == 1))
		return;
	var pos = goForth ? this.history.position+1 : this.history.position-1;
	if (this.history.values.length && this.history.values[pos-1] !== undefined) {
		this.history.position = pos;
		this.restoreImg(this.history.values[this.history.position-1]);
	}
	this.saveLocalStorage();
};

DrawingBoard.prototype.goBackInHistory = function() {
	this._goThroughHistory(false);
};

DrawingBoard.prototype.goForthInHistory = function() {
	this._goThroughHistory(true);
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
	if (this.opts.localStorage && window.localStorage && localStorage.getItem('drawing-board-image') !== null) {
		this.restoreImg(localStorage.getItem('drawing-board-image'));
	}
};

DrawingBoard.prototype.saveLocalStorage = function() {
	if (this.opts.localStorage && window.localStorage) {
		localStorage.setItem('drawing-board-image', this.getImg());
	}
};

DrawingBoard.prototype.initDrawEvents = function() {
	var that = this;
	this.isDrawing = false;
	this.coords = {};
	this.coords.old = this.coords.current = this.coords.oldMid = { x: 0, y: 0 };

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
	if (this.ctx.lineWidth > 10 && this.dom.$canvas.is(':hover')) {
		this.dom.$cursor.css({ width: this.ctx.lineWidth + 'px', height: this.ctx.lineWidth + 'px' });
		var transform = DrawingBoard.Utils.tpl("translateX({{x}}px) translateY({{y}}px)", { x: this.coords.current.x-(this.ctx.lineWidth/2), y: this.coords.current.y-(this.ctx.lineWidth/2) });
		this.dom.$cursor.css({ 'transform': transform, '-webkit-transform': transform, '-ms-transform': transform });
		this.dom.$cursor.removeClass('drawing-board-utils-hidden');
	} else {
		this.dom.$canvas.css('cursor', 'crosshair');
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
};

DrawingBoard.prototype._onInputStart = function(e, coords) {
	this.coords.current = this.coords.old = coords;
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
	this.controls = [];
	for (var i = 0; i < this.opts.controls.length; i++) {
		var c = new window['DrawingBoard']['Control'][this.opts.controls[i]](this);
		this.controls.push(c);
		this.addControl(c);
	}
};

DrawingBoard.prototype.addControl = function(control) {
	this.dom.$controls.append(control.$el);
};

DrawingBoard.Control = {};