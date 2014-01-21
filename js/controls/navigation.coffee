DrawingBoard.Control.Navigation = DrawingBoard.Control.extend(
  name: "navigation"
  defaults:
    back: true
    forward: true
    reset: true

  initialize: ->
    el = ""
    el += "<button class=\"drawing-board-control-navigation-back\">&larr;</button>"  if @opts.back
    el += "<button class=\"drawing-board-control-navigation-forward\">&rarr;</button>"  if @opts.forward
    el += "<button class=\"drawing-board-control-navigation-reset\">&times;</button>"  if @opts.reset
    @$el.append el
    if @opts.back
      $back = @$el.find(".drawing-board-control-navigation-back")
      @board.ev.bind "historyNavigation", $.proxy((pos) ->
        if pos is 1
          $back.attr "disabled", "disabled"
        else
          $back.removeAttr "disabled"
        return
      , this)
      @$el.on "click", ".drawing-board-control-navigation-back", $.proxy((e) ->
        @board.goBackInHistory()
        e.preventDefault()
        return
      , this)
    if @opts.forward
      $forward = @$el.find(".drawing-board-control-navigation-forward")
      @board.ev.bind "historyNavigation", $.proxy((pos) ->
        if pos is @board.history.values.length
          $forward.attr "disabled", "disabled"
        else
          $forward.removeAttr "disabled"
        return
      , this)
      @$el.on "click", ".drawing-board-control-navigation-forward", $.proxy((e) ->
        @board.goForthInHistory()
        e.preventDefault()
        return
      , this)
    if @opts.reset
      @$el.on "click", ".drawing-board-control-navigation-reset", $.proxy((e) ->
        @board.reset background: true
        e.preventDefault()
        return
      , this)
    return
)
