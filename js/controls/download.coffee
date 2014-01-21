DrawingBoard.Control.Download = DrawingBoard.Control.extend(
  name: "download"
  initialize: ->
    @$el.append "<button class=\"drawing-board-control-download-button\"></button>"
    @$el.on "click", ".drawing-board-control-download-button", $.proxy((e) ->
      @board.downloadImg()
      e.preventDefault()
      return
    , this)
    return
)
