# drawingboard.js

This is a simple canvas based drawing app that you can integrate easily on your website.

drawingboard.js consists of a blank canvas surrounded by a few UI elements that controls it:

* a color chooser ,
* a pencil size chooser,
* navigation buttons to undo or redo lines,
* a reset button to put the canvas back to its original blank state

You can draw with mouse or touch on pretty much [every browser that supports `<canvas>`](http://caniuse.com/#feat=canvas).

localStorage support is provided: your last drawing is restored when you come back on the website.

## Requirements and Installation

[Check the source of the demo page to see in details how to integrate the drawingboard](http://manu.habite.la/drawingboard/example/)

drawingboard.js requires a few things in order to work correctly:

1. `jQuery`, `Zepto` or any other jQuery API compatible library
2. An `input[type=range]` polyfill so that the pencil size control works [in every browser](http://caniuse.com/#feat=input-range)

After including all the requirements in your page, you can include the minified script and stylesheet contained in the `dist` folder.

## Creating a drawingboard

[Check the source of the demo page to see in details how to integrate the drawingboard](http://manu.habite.la/drawingboard/example/)

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

* `controls`: an array containing the list of controls automatically loaded with the board. By default, the 'Color', 'Size' and 'Navigation' controls are loaded by default.
* `color`: the board's pencil color. `#000000` (black) by default.
* `size`: the board's pencil size. `3`px radius by default.
* `background`: the board's background. Give an hex value for a color, anything else will be seen as an image. `#ffffff` (white) by default.
* `localStorage`: do we enable localStorage support? If true (it is by default), the drawing is saved when you quit the website and restored when you come back on it.

## Controls

A "control" is a UI element designed to let the user interact with the board. Change the size/color of the pencil, navigate through the drawings history, have an "eraser" button... you can pretty much do what you want.

The drawingboard has a few simple controls loaded by default, but you can easily create your own if the given ones don't satisfy you or else.

Every control has in own class in the `js/controls` folder and have a few things in common:

* the 1st parameter of the constructor is always the board tied to the control. It lets you access to all the attributes and methods of the drawingboard.
* the control has an `$el` attribute (a jQuery object): it is the UI element you can interact with. This is required.
* the HTML element representing the control should have a `drawing-board-control` class.

To add a control to an already created board:

	var myDownloadControl = new Drawingboard.Control.Download(myBoard);
	myBoard.addControl(myDownloadControl);

## Events

The drawingboard has events included that you can rely on. Events are all dispatched in the `ev` attribute of the board, which is based on [the microevent.js library](https://github.com/jeromeetienne/microevent.js).

Events currently triggered are: 

* 'board:reset'
* 'board:restoreLocalStorage'
* 'board:saveLocalStorage'
* 'board:startDrawing'
* 'board:drawing'
* 'board:stopDrawing'
* 'board:mouseOver'
* 'board:mouseOut'

## Building your own

If you've added some controls or changed the drawingboard a bit, you can rebuild the minified files with [grunt](http://gruntjs.com/):

* in the `grunt.js` file, update the `concat` task by setting all the source files you want
* [install grunt](http://gruntjs.com/getting-started) if necessary, open your terminal, `cd` in the project and run `grunt`. Minified files in the `dist` folders are now updated.