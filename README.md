# drawingboard.js

This is a canvas based drawing app that you can integrate easily on your website.

drawingboard.js consists of a blank canvas surrounded by a few UI elements that control it: a color picker, a pencil, a paint can, an eraser, a pencil size chooser, navigations and reset buttons.

You can draw with mouse or touch on pretty much [every browser that supports `<canvas>`](http://caniuse.com/#feat=canvas). Didn't test that much on IE but hey, WIP.

local and session storage are supported: your last drawing is restored when you come back on the website.

You can set a background image at initialization, or let the user drop one on the canvas.

The drawingboard is really lightweight, but also really simple: if you want something more complete, go look at similar projects at the bottom of this doc.

## Requirements and Installation

[Check the source of the demo page to see how to integrate the drawingboard in practice](http://manu.habite.la/drawingboard/example/)

The board requires jQuery. Since its usage is pretty light, it may work as usual if you use zepto but I didn't test it.

If you use [Bower](http://twitter.github.com/bower/), getting the files is easy with command line: `bower install drawingboard.js`.

After jQuery, you can include the minified script and stylesheet contained in the `dist` folder. `drawingboard.min.js` *(~4.1kb minified and gzipped)* contains everything whereas `drawingboard.nocontrol.min.js` *(~2.6kb)* [does not contain controls](http://manu.habite.la/drawingboard/img/moto.jpg). Don't worry about having to store icon files on your server: they are directly embedded in the CSS as base64 strings.

## Creating a drawingboard

[Check the source of the demo page to see how to integrate the drawingboard in practice](http://manu.habite.la/drawingboard/example/)

The drawingboard is tied to an HTML element with an #id. Set the dimensions of the desired board with CSS on the HTML element, and create it with one line of JavaScript:

```html
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
```

### Options

When instantiating the drawingboard, you can pass a few options as the 2nd parameter in an object:

* `controls`: an array containing the list of controls automatically loaded with the board. The 'Color', 'DrawingMode', 'Size' and 'Navigation' controls are loaded by default. You can pass an object instead of a string to pass control options (ie `['Color', { Navigation: { reset: false }}]`).
* `controlsPosition`: define where to put the controls: at the "top" or "bottom" of the canvas, aligned to "left"/"right"/"center". `"top left"` by default.
* `color`: the board's pencil color. `"#000000"` (black) by default.
* `size`: the board's pencil size (integer). `1`px radius by default.
* `background`: the board's background. Give an hex/rgb/hsl value for a color, `false` to have nothing (transparent board). Anything else will be seen as an image. `"#fff"` (white) by default.
* `eraserColor`: color of the eraser tool. Set to `"background"` so that the eraser takes the background color, `"transparent"` to make transparent lines or set any other color directly (rgb, hsl, #). `"background"` by default.
* `webStorage`: do we enable webStorage support? can be `"session"`, `"local"` or false. The drawing is saved in sessionStorage or localStorage and restored when you come back on it. `"session"` by default.
* `droppable`: do we allow the user to drop an image on the board to draw on it? `false` by default.
* `enlargeYourContainer`: how should be sized the drawingboard? When `true`, the CSS width and height will be set on the final board's *canvas*, ie the drawing zone. In the example above, that means the board's container will be taller than 400px because of the controls height. If `false`, the CSS width and height will be set on the board's container. That means the addition of the canvas and the controls will be 400px high. `false` by default.
* `errorMessage`: html string to put in the board's element on browsers that don't support canvas.
* `stretchImg`: default behavior of image setting on the canvas: set to the canvas width/height or not? `false` by default

## Controls

A "control" is a UI element designed to let the user interact with the board. Change the size/color of the pencil, navigate through the drawings history, have an "eraser" button... you can pretty much do what you want.

The drawingboard has a few simple controls loaded by default, but you can easily create your own if the given ones don't satisfy you or else.

### Included controls

* `DrawingBoard.Control.Color`: the color picker.
* `DrawingBoard.Control.Size`: a pencil size chooser. Choose your `type` in the options: `"dropdown"` is a simple dropdown menu, whereas `"range"` uses a range input. Default to `"auto"`: if the browser supports the range input it will use it, otherwise it will use the dropdown menu. As seen in the example page, you can set the type to `"range"` and add a [range input polyfill](https://github.com/freqdec/fd-slider) if you want it on [every browser](http://caniuse.com/#feat=input-range).
* `DrawingBoard.Control.DrawingMode`: show buttons to draw with the `"pencil"` (normal mode), the `"filler"` (the paint can) and an `"eraser"`. You can choose which buttons to show with the options.
* `DrawingBoard.Control.Navigation`: undo, redo actions and reset the canvas to blank with 3 buttons. You can choose to show or hide each button individually with options.
* `DrawingBoard.Control.Download`: show a button to download current drawing *(not loaded by default)*.

### Creating new controls

Every control extends the `DrawingBoard.Control` class. You can define a new control by extending it in the same way [Backbone.js](http://backbonejs.org/) works:

```javascript
DrawingBoard.Control.Example = DrawingBoard.Control.extend({
	//prototype
});
```

A control has a few attributes and methods:

* `name`: name of the control. Used to add a class on the div element that will be appended to the drawing-board-controls container (prefixed with "drawing-board-control-").
* `$el`: the jQuery object that will be appended to the drawing-board-controls container.
* `initialize`: the function invoked when a new instance of the control is created. A `DrawingBoard.Board` object is passed as 1st argument and an object of options as 2nd.
* `board`: the `DrawingBoard.Board` attached to the control.
* `opts`: the options passed at initialization of an instance.
* `defaults`: default options of the class.
* `addToBoard`: appends the control to the DOM.
* `onBoardReset`: method bind to the `board:reset` event.

With the `board` property you can pretty much do what you want: bind to and trigger events (`this.board.ev`), manipulate the canvas through the rendering context (`this.board.ctx`), etc.

*Note:* since the controls are displayed as `table-cell`, you might want to add a `div.drawing-board-control-inner` when you create your control template (like in the 'Color' and the 'Size' controls) if you need to position relative/absolute things.

## Events

The drawingboard has events included that you can rely on. Events are all dispatched in the `ev` attribute of the board, which is based on [the microevent.js library](https://github.com/jeromeetienne/microevent.js).

Events currently triggered are:

* board:reset
* board:restoreLocalStorage
* board:restoreSessionStorage
* board:saveLocalStorage
* board:saveSessionStorage
* board:clearLocalStorage
* board:clearSessionStorage
* board:mode
* board:startDrawing
* board:drawing
* board:stopDrawing
* board:mouseOver
* board:mouseOut
* board:userAction
* board:imageDropped
* color:changed *(from the Color control)*
* size:changed *(from the Size control)*

When using the drawingboard or adding features, follow the MicroEvent simple API:

```javascript
var myBoard = new DrawingBoard.Board('zbeubeu');

//listen to an event
myBoard.ev.bind('board:reset', why);

//stop listening to it
myBoard.ev.unbind('board:reset', why);

function why() {
    alert('OH GOD WHY');
}

//you can also trigger new events
myBoard.ev.trigger('readme:example', 'what', 'up');

//and listen to them
myBoard.ev.bind('readme:example', function(one, two) {
    console.log(one, two); // 'what', 'up'
});
```


## Getting the image inside the board to store server-side

A common thing you may want to do is to store images drawn with the board on your server. This is simple to do with the `getImg` method that returns the board content as a 64 bit encoded PNG URL.

One very simple example of storing drawingboard images with PHP is shown [in this gist](https://gist.github.com/Leimi/9179019).

## Building your own

If you have style changes to make, you can use [Compass](http://compass-style.org/).
If you've added some controls or changed the drawingboard a bit, you can rebuild the minified files with [Grunt](http://gruntjs.com/):

* in the `Gruntfile.js` file, update the `concat` task by setting all the source files you want
* [install grunt](http://gruntjs.com/getting-started) globally if necessary, and run `npm install` in your command line in the project to install the project-specific grunt tools. In the end, run `grunt`. Minified files in the `dist` folders are now updated.

## Third party stuff used

The drawingboard works thanks to:

* [jQuery](http://jquery.com) for DOM manipulation,
* [Compass](http://compass-style.org/) for styling,
* [Yusuke Kamiyamane's Fugue Icons](http://p.yusukekamiyamane.com/) for icons,
* [MicroEvent](https://github.com/jeromeetienne/microevent.js) for simple events,
* [tim](http://github.com/premasagar/tim) for simple templates,
* [Grunt](http://gruntjs.com) for all the building stuff.

## Want more? Alternatives to drawingboard.js

drawingboard.js is a library I built because I couldn't find anything like it in the beginning of 2013.

It's really lightweight, simple to use and integrate, works great on mobile and draws really smooth lines! But it misses a few important features and it's not that extendable…

Here are a couple of other tools you can try if the drawingboard doesn't satisfy you:

* [Literally Canvas](http://literallycanvas.com/),
* [wPaint.js](http://wpaint.websanova.com/).

## License

drawingboard.js is [MIT licensed](LICENSE).

Copyright (c) 2013 Emmanuel "[@Leimina](http://twitter.com/Leimina)" Pelletier.