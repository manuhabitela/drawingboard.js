DrawingBoard.Control.DrawingMode = DrawingBoard.Control.extend(
  name: "drawingmode"
  defaults:
    pencil: true
    eraser: true
    filler: true

  initialize: ->
    @prevMode = @board.getMode()
    $.each [
      "pencil"
      "eraser"
      "filler"
    ], $.proxy((k, value) ->
      @$el.append "<button class=\"drawing-board-control-drawingmode-" + value + "-button\" data-mode=\"" + value + "\"></button>"  if @opts[value]
      return
    , this)
    @$el.on "click", "button[data-mode]", $.proxy((e) ->
      value = $(e.currentTarget).attr("data-mode")
      mode = @board.getMode()
      @prevMode = mode  if mode isnt value
      newMode = (if mode is value then @prevMode else value)
      @board.setMode newMode
      e.preventDefault()
      return
    , this)
    @board.ev.bind "board:mode", $.proxy((mode) ->
      @toggleButtons mode
      return
    , this)
    @toggleButtons @board.getMode()
    return

  toggleButtons: (mode) ->
    @$el.find("button[data-mode]").each (k, item) ->
      $item = $(item)
      $item.toggleClass "active", mode is $item.attr("data-mode")
      return

    return
)
