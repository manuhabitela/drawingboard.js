# simple-undo

[![Build Status](https://travis-ci.org/mattjmattj/simple-undo.svg)](https://travis-ci.org/mattjmattj/simple-undo)

simple-undo is a very basic javascript undo/redo stack for managing histories of basically anything.

Initially created to help fixing an issue in [drawingboard.js](https://github.com/Leimi/drawingboard.js/issues/29).

## Installation

### Bower

`bower install simple-undo`.

### NPM

`npm install simple-undo`

## Usage

If you are using simple-undo in the browser, a SimpleUndo object is exported in `window` after including simple-undo in your page, so it is very easy to use.

If you are using simple-undo as a nodejs module, just do `var SimpleUndo = require('simple-undo');`

```javascript

var myObject = {};

function myObjectSerializer(done) {
    done(JSON.stringify(myObject));
}

function myObjectUnserializer(serialized) {
    myObject = JSON.parse(serialized);
}

var history = new SimpleUndo({
    maxLength: 10,
    provider: myObjectSerializer
});

myObject.foo = 'bar';
history.save();
myObject.foo = 'baz';
history.save();

history.undo(myObjectUnserializer);
// myObject.foo == 'bar'
history.redo(myObjectUnserializer);
// myObject.foo == 'baz'

```

Another example is available on the [GitHub page of the project](http://mattjmattj.github.io/simple-undo/)

## Options and API

Accepted options are

* `provider` : required. a function to call on `save`, which should provide the current state of the historized object through the given `done` callback
* `maxLength` : the maximum number of items in history
* `opUpdate` : a function to call to notify of changes in history. Will be called on `save`, `undo`, `redo` and `clear`

SimpleUndo

* `initialize (initialState)` : registers the initial state of the managed object. If not call the default initial state is NULL
* `save ()` : calls the `provider` and registers whatever it gives
* `undo (callback)` : calls the callback with the previous state of the managed object in history
* `redo (callback)` : calls the callback with the next state of the managed object in history
* `clear ()` : clears the whole history, except the inital state if any
* `count ()` : returns the count of elements in history, apart from the inital state

## License

simple-undo is licensed under the terms of the [Beerware license](LICENSE).

2014 - Matthias Jouan