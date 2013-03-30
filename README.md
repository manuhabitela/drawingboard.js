# drawingboard.js

This is a simple canvas based drawing app that you can integrate easily on your website.

drawingboard.js consists of a blank canvas surrounded by a few UI elements that controls it:

* a color picker,
* a pencil size chooser,
* navigation buttons to undo or redo lines,
* a reset button to put the canvas back to its original blank state

You can draw with mouse or touch on pretty much [every browser that supports `<canvas>`](http://caniuse.com/#feat=canvas). Didn't test that much on IE and there are a few problems in Opera, but hey, WIP.

localStorage support is provided: your last drawing is restored when you come back on the website.

## Requirements and Installation

[Check the source of the demo page to see how to integrate the drawingboard in practice](http://manu.habite.la/drawingboard/example/)

The board's only requirement is jQuery. Since its usage is pretty light, it may work as usual if you use zepto but I didn't test it.

The pencil size chooser control has two possible templates: a simple dropdown list or an HTML5 range input. In case you use it with the range input, including a polyfill such as [https://github.com/freqdec/fd-slider](fd-slider) is recommended so that it works [in every browser](http://caniuse.com/#feat=input-range).

If you use [Bower](http://twitter.github.com/bower/), getting the files is easy with command line: `bower install drawingboard.js`;

After including the requirements in your page, you can include the minified script and stylesheet contained in the `dist` folder. `drawingboard.min.js` contains the board whereas `drawingboard.full.min.js` contains the board *and* the default controls ('Color', 'Size', 'Navigation').

## Creating a drawingboard

[Check the source of the demo page to see how to integrate the drawingboard in practice](http://manu.habite.la/drawingboard/example/)

The drawingboard is tied to an HTML element with an #id. Set the dimensions of the desired board with CSS on the HTML element, and create it with one line of JavaScript:

	<div id="zbeubeu"></div>

	<style>
		#zbeubeu {
			width: 400px;
			height: 600px;
		}
	</style>

	<script>
		var myBoard = new DrawingBoard.Board('zbeubeu');
	</script>

### Options

When instantiating the drawingboard, you can pass a few options as the 2nd parameter in an object:

* `controls`: an array containing the list of controls automatically loaded with the board. By default, the 'Color', 'Size' and 'Navigation' controls are loaded by default. You can pass an object instead of a string to pass control options (ie `['Color', { Navigation: { reset: false }}]`).
* `color`: the board's pencil color. `#000000` (black) by default.
* `size`: the board's pencil size (integer). `3`px radius by default.
* `background`: the board's background. Give an hex value for a color, anything else will be seen as an image. `#ffffff` (white) by default.
* `localStorage`: do we enable localStorage support? If true, the drawing is saved when you quit the website and restored when you come back on it. False by default since there is a bug when multiple boards are on the same page...

## Controls

A "control" is a UI element designed to let the user interact with the board. Change the size/color of the pencil, navigate through the drawings history, have an "eraser" button... you can pretty much do what you want.

The drawingboard has a few simple controls loaded by default, but you can easily create your own if the given ones don't satisfy you or else.

Existing controls are:

* `DrawingBoard.Control.Color`: a color picker. When `compact` option is set to `true`, colors are visible in a dropdown by clicking on the current color.
* `DrawingBoard.Control.Size`: a pencil size chooser. Choose your `type` in the options: `list` is a simple dropdown menu, whereas `range` uses a range input. Default to `list` since it supports more browsers. 
* `DrawingBoard.Control.Navigation`: undo, redo actions and reset the canvas to blank with 3 buttons. You can choose to show or hide each button individually with options.
* `DrawingBoard.Control.Download`: show a button to download current drawing (*not loaded by default*) 

Every control extends the `DrawingBoard.Control` class. You can define a new control by extending it in the same way [http://backbonejs.org/](Backbone.js) works:

	DrawingBoard.Control.Example = DrawingBoard.Control.extend({
		...
	});

A control has a few attributes and methods:

* `name`: name of the control. Used to add a class on the div element that will be appended to the drawing-board-controls container (prefixed with "drawing-board-control-").
* `$el`: the jQuery object that will be appended to the drawing-board-controls container.
* `initialize`: the function invoked when a new instance of the control is created. A `DrawingBoard.Board` object is passed as 1st argument and an object of options as 2nd.
* `board`: the `DrawingBoard.Board` attached to the control.
* `opts`: the options passed at initialization of an instance.
* `defaults`: default options of the class.
* `addToBoard`: appends the control to the DOM.
* `onBoardReset`: method bind to the `board:reset` event.

Since the controls are displayed as `table-cell`, you might want to add a `div.drawing-board-control-inner` when you create your control template (like in the 'Color' and the 'Size' controls) if you need to position relative/absolute things.

## Events

The drawingboard has events included that you can rely on. Events are all dispatched in the `ev` attribute of the board, which is based on [the microevent.js library](https://github.com/jeromeetienne/microevent.js).

Events currently triggered are:

* board:reset
* board:restoreLocalStorage
* board:saveLocalStorage
* board:startDrawing
* board:drawing
* board:stopDrawing
* board:mouseOver
* board:mouseOut


## Building your own

If you've added some controls or changed the drawingboard a bit, you can rebuild the minified files with [grunt](http://gruntjs.com/):

* in the `grunt.js` file, update the `concat` task by setting all the source files you want
* [install grunt](http://gruntjs.com/getting-started) if necessary, open your terminal, `cd` in the project and run `grunt`. Minified files in the `dist` folders are now updated.