DrawingBoard.Control.Size = DrawingBoard.Control.extend(
  name: "size"
  defaults:
    type: "auto"
    dropdownValues: [
      1
      3
      6
      10
      20
      30
      40
      50
    ]

  types: [
    "dropdown"
    "range"
  ]
  initialize: ->
    @opts.type = (if @_iHasRangeInput() then "range" else "dropdown")  if @opts.type is "auto"
    tpl = (if $.inArray(@opts.type, @types) > -1 then this["_" + @opts.type + "Template"]() else false)
    return false  unless tpl
    @val = @board.opts.size
    @$el.append $(tpl)
    @$el.attr "data-drawing-board-type", @opts.type
    @updateView()
    that = this
    if @opts.type is "range"
      @$el.on "change", ".drawing-board-control-size-range-input", (e) ->
        that.val = $(this).val()
        that.updateView()
        that.board.ev.trigger "size:changed", that.val
        e.preventDefault()
        return

    if @opts.type is "dropdown"
      @$el.on "click", ".drawing-board-control-size-dropdown-current", $.proxy((e) ->
        @$el.find(".drawing-board-control-size-dropdown").toggleClass "drawing-board-utils-hidden"
        return
      , this)
      @$el.on "click", "[data-size]", (e) ->
        that.val = parseInt($(this).attr("data-size"), 0)
        that.updateView()
        that.board.ev.trigger "size:changed", that.val
        e.preventDefault()
        return

    return

  _rangeTemplate: ->
    tpl = "<div class=\"drawing-board-control-inner\" title=\"{{size}}\">" + "<input type=\"range\" min=\"1\" max=\"50\" value=\"{{size}}\" step=\"1\" class=\"drawing-board-control-size-range-input\">" + "<span class=\"drawing-board-control-size-range-current\"></span>" + "</div>"
    DrawingBoard.Utils.tpl tpl,
      size: @board.opts.size


  _dropdownTemplate: ->
    tpl = "<div class=\"drawing-board-control-inner\" title=\"{{size}}\">" + "<div class=\"drawing-board-control-size-dropdown-current\"><span></span></div>" + "<ul class=\"drawing-board-control-size-dropdown\">"
    $.each @opts.dropdownValues, (i, size) ->
      tpl += DrawingBoard.Utils.tpl("<li data-size=\"{{size}}\"><span style=\"width: {{size}}px; height: {{size}}px; border-radius: {{size}}px;\"></span></li>",
        size: size
      )
      return

    tpl += "</ul></div>"
    tpl

  onBoardReset: (opts) ->
    @updateView()
    return

  updateView: ->
    val = @val
    @board.ctx.lineWidth = val
    @$el.find(".drawing-board-control-size-range-current, .drawing-board-control-size-dropdown-current span").css
      width: val + "px"
      height: val + "px"
      borderRadius: val + "px"
      marginLeft: -1 * val / 2 + "px"
      marginTop: -1 * val / 2 + "px"

    @$el.find(".drawing-board-control-inner").attr "title", val
    if @opts.type is "dropdown"
      closest = null
      $.each @opts.dropdownValues, (i, size) ->
        closest = size  if closest is null or Math.abs(size - val) < Math.abs(closest - val)
        return

      @$el.find(".drawing-board-control-size-dropdown").addClass "drawing-board-utils-hidden"
    return

  _iHasRangeInput: ->
    inputElem = document.createElement("input")
    smile = ":)"
    docElement = document.documentElement
    inputElemType = "range"
    available = undefined
    inputElem.setAttribute "type", inputElemType
    available = inputElem.type isnt "text"
    inputElem.value = smile
    inputElem.style.cssText = "position:absolute;visibility:hidden;"
    if /^range$/.test(inputElemType) and inputElem.style.WebkitAppearance?
      docElement.appendChild inputElem
      defaultView = document.defaultView
      available = defaultView.getComputedStyle and defaultView.getComputedStyle(inputElem, null).WebkitAppearance isnt "textfield" and (inputElem.offsetHeight isnt 0)
      docElement.removeChild inputElem
    !!available
)
