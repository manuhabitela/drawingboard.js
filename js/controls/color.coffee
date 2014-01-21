DrawingBoard.Control.Color = DrawingBoard.Control.extend(
  name: "colors"
  initialize: ->
    @initTemplate()
    that = this
    @$el.on "click", ".drawing-board-control-colors-picker", (e) ->
      color = $(this).attr("data-color")
      that.board.setColor color
      that.$el.find(".drawing-board-control-colors-current").css("background-color", color).attr "data-color", color
      that.board.ev.trigger "color:changed", color
      that.$el.find(".drawing-board-control-colors-rainbows").addClass "drawing-board-utils-hidden"
      e.preventDefault()
      return

    @$el.on "click", ".drawing-board-control-colors-current", (e) ->
      that.$el.find(".drawing-board-control-colors-rainbows").toggleClass "drawing-board-utils-hidden"
      e.preventDefault()
      return

    $("body").on "click", (e) ->
      $target = $(e.target)
      $relatedButton = (if $target.hasClass("drawing-board-control-colors-current") then $target else $target.closest(".drawing-board-control-colors-current"))
      $myButton = that.$el.find(".drawing-board-control-colors-current")
      $popup = that.$el.find(".drawing-board-control-colors-rainbows")
      $popup.addClass "drawing-board-utils-hidden"  if (not $relatedButton.length or $relatedButton.get(0) isnt $myButton.get(0)) and not $popup.hasClass("drawing-board-utils-hidden")
      return

    return

  initTemplate: ->
    tpl = "<div class=\"drawing-board-control-inner\">" + "<div class=\"drawing-board-control-colors-current\" style=\"background-color: {{color}}\" data-color=\"{{color}}\"></div>" + "<div class=\"drawing-board-control-colors-rainbows\">{{rainbows}}</div>" + "</div>"
    oneColorTpl = "<div class=\"drawing-board-control-colors-picker\" data-color=\"{{color}}\" style=\"background-color: {{color}}\"></div>"
    rainbows = ""
    $.each [
      0.75
      0.5
      0.25
    ], $.proxy((key, val) ->
      i = 0
      additionalColor = null
      rainbows += "<div class=\"drawing-board-control-colors-rainbow\">"
      additionalColor = @_rgba(0, 0, 0, 1)  if val is 0.25
      additionalColor = @_rgba(150, 150, 150, 1)  if val is 0.5
      additionalColor = @_rgba(255, 255, 255, 1)  if val is 0.75
      rainbows += DrawingBoard.Utils.tpl(oneColorTpl,
        color: additionalColor.toString()
      )
      while i <= 330
        rainbows += DrawingBoard.Utils.tpl(oneColorTpl,
          color: @_hsl2Rgba(@_hsl(i - 60, 1, val)).toString()
        )
        i += 30
      rainbows += "</div>"
      return
    , this)
    @$el.append $(DrawingBoard.Utils.tpl(tpl,
      color: @board.color
      rainbows: rainbows
    ))
    @$el.find(".drawing-board-control-colors-rainbows").addClass "drawing-board-utils-hidden"
    return

  onBoardReset: (opts) ->
    @board.setColor @$el.find(".drawing-board-control-colors-current").attr("data-color")
    return

  _rgba: (r, g, b, a) ->
    r: r
    g: g
    b: b
    a: a
    toString: ->
      "rgba(" + r + ", " + g + ", " + b + ", " + a + ")"

  _hsl: (h, s, l) ->
    h: h
    s: s
    l: l
    toString: ->
      "hsl(" + h + ", " + s * 100 + "%, " + l * 100 + "%)"

  _hex2Rgba: (hex) ->
    num = parseInt(hex.substring(1), 16)
    @_rgba num >> 16, num >> 8 & 255, num & 255, 1

  
  #conversion function (modified a bit) taken from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
  _hsl2Rgba: (hsl) ->
    hue2rgb = (p, q, t) ->
      t += 1  if t < 0
      t -= 1  if t > 1
      return p + (q - p) * 6 * t  if t < 1 / 6
      return q  if t < 1 / 2
      return p + (q - p) * (2 / 3 - t) * 6  if t < 2 / 3
      p
    h = hsl.h / 360
    s = hsl.s
    l = hsl.l
    r = undefined
    g = undefined
    b = undefined
    if s is 0
      r = g = b = l # achromatic
    else
      q = (if l < 0.5 then l * (1 + s) else l + s - l * s)
      p = 2 * l - q
      r = Math.floor((hue2rgb(p, q, h + 1 / 3)) * 255)
      g = Math.floor((hue2rgb(p, q, h)) * 255)
      b = Math.floor((hue2rgb(p, q, h - 1 / 3)) * 255)
    @_rgba r, g, b, 1
)
