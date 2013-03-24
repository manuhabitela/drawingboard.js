# drawingboard.js

This is a simple canvas based drawing app that you can integrate easily on your website.

drawingboard.js consists of a blank canvas surrounded by a few UI elements that controls it:

* a color chooser ,
* a pencil size chooser,
* navigation buttons to undo or redo lines,
* a reset button to put the canvas back to its original blank state

## Requirements and Installation

[Check the source of the demo page to see in details how to integrate the drawingboard](http://manu.habite.la/drawingboard/example/)

drawingboard.js requires a few things in order to work correctly:

1. `jQuery`, `Zepto`, `Tire` or any other jQuery API compatible library
2. a `requestAnimationFrame` polyfill in order to work correctly in every browser
3. An `input[type=range]` polyfill so that the pencil size control works in every browser

After including all the requirements in your page, you can include the minified script and stylesheet contained in the `dist` folder.