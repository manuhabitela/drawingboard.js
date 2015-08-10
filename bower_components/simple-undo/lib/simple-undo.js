(function() {
	
'use strict';

/**
 * SimpleUndo is a very basic javascript undo/redo stack for managing histories of basically anything.
 * 
 * options are: {
 * 	* `provider` : required. a function to call on `save`, which should provide the current state of the historized object through the given "done" callback
 * 	* `maxLength` : the maximum number of items in history
 * 	* `opUpdate` : a function to call to notify of changes in history. Will be called on `save`, `undo`, `redo` and `clear`
 * }
 * 
 */
var SimpleUndo = function(options) {
	
	var settings = options ? options : {};
	var defaultOptions = {
		provider: function() {
			throw new Error("No provider!");
		},
		maxLength: 30,
		onUpdate: function() {}
	};
	
	this.provider = (typeof settings.provider != 'undefined') ? settings.provider : defaultOptions.provider;
	this.maxLength = (typeof settings.maxLength != 'undefined') ? settings.maxLength : defaultOptions.maxLength;
	this.onUpdate = (typeof settings.onUpdate != 'undefined') ? settings.onUpdate : defaultOptions.onUpdate;
	
	this.initialItem = null;
	this.clear();
};

function truncate (stack, limit) {
	while (stack.length > limit) {
		stack.shift();
	}
}

SimpleUndo.prototype.initialize = function(initialItem) {
	this.stack[0] = initialItem;
	this.initialItem = initialItem;
};


SimpleUndo.prototype.clear = function() {
	this.stack = [this.initialItem];
	this.position = 0;
	this.onUpdate();
};

SimpleUndo.prototype.save = function() {
	this.provider(function(current) {
		truncate(this.stack, this.maxLength);
		this.position = Math.min(this.position,this.stack.length - 1);
		
		this.stack = this.stack.slice(0, this.position + 1);
		this.stack.push(current);
		this.position++;
		this.onUpdate();
	}.bind(this));
};

SimpleUndo.prototype.undo = function(callback) {
	if (this.canUndo()) {
		var item =  this.stack[--this.position];
		this.onUpdate();
		
		if (callback) {
			callback(item);
		}
	}
};

SimpleUndo.prototype.redo = function(callback) {
	if (this.canRedo()) {
		var item = this.stack[++this.position];
		this.onUpdate();
		
		if (callback) {
			callback(item);
		}
	}
};

SimpleUndo.prototype.canUndo = function() {
	return this.position > 0;
};

SimpleUndo.prototype.canRedo = function() {
	return this.position < this.count();
};

SimpleUndo.prototype.count = function() {
	return this.stack.length - 1; // -1 because of initial item
};





//exports
// node module
if (typeof module != 'undefined') {
	module.exports = SimpleUndo;
}

// browser global
if (typeof window != 'undefined') {
	window.SimpleUndo = SimpleUndo;
}

})();