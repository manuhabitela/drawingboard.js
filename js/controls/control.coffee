DrawingBoard.Control = (drawingBoard, opts) ->
  @board = drawingBoard
  @opts = $.extend({}, @defaults, opts)
  @$el = $(document.createElement("div")).addClass("drawing-board-control")
  @$el.addClass "drawing-board-control-" + @name  if @name
  @board.ev.bind "board:reset", $.proxy(@onBoardReset, this)
  @initialize.apply this, arguments_
  this

DrawingBoard.Control:: =
  name: ""
  defaults: {}
  initialize: ->

  addToBoard: ->
    @board.addControl this
    return

  onBoardReset: (opts) ->


#extend directly taken from backbone.js
DrawingBoard.Control.extend = (protoProps, staticProps) ->
  parent = this
  child = undefined
  if protoProps and protoProps.hasOwnProperty("constructor")
    child = protoProps.constructor
  else
    child = ->
      parent.apply this, arguments_
  $.extend child, parent, staticProps
  Surrogate = ->
    @constructor = child
    return

  Surrogate:: = parent::
  child:: = new Surrogate()
  $.extend child::, protoProps  if protoProps
  child.__super__ = parent::
  child
