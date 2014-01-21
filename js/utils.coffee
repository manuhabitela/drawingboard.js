window.DrawingBoard = (if typeof DrawingBoard isnt "undefined" then DrawingBoard else {})
DrawingBoard.Utils = {}

#!
#* Tim (lite)
#*   github.com/premasagar/tim
#
#
#	A tiny, secure JavaScript micro-templating script.
#
DrawingBoard.Utils.tpl = (->
  "use strict"
  start = "{{"
  end = "}}"
  path = "[a-z0-9_][\\.a-z0-9_]*" # e.g. config.person.name
  pattern = new RegExp(start + "\\s*(" + path + ")\\s*" + end, "gi")
  undef = undefined
  (template, data) ->
    
    # Merge data into the template string
    template.replace pattern, (tag, token) ->
      path = token.split(".")
      len = path.length
      lookup = data
      i = 0
      while i < len
        lookup = lookup[path[i]]
        
        # Property not found
        throw new Error "tim: '" + path[i] + "' not found in " + tag  if lookup is undef
        
        # Return the required value
        return lookup  if i is len - 1
        i++
      return

)()

###
https://github.com/jeromeetienne/microevent.js
MicroEvent - to make any js object an event emitter (server or browser)

- pure javascript - server compatible, browser compatible
- dont rely on the browser doms
- super simple - you get it immediatly, no mistery, no magic involved

- create a MicroEventDebug with goodies to debug
- make it safer to use
###
DrawingBoard.Utils.MicroEvent = ->

DrawingBoard.Utils.MicroEvent:: =
  bind: (event, fct) ->
    @_events = @_events or {}
    @_events[event] = @_events[event] or []
    @_events[event].push fct
    return

  unbind: (event, fct) ->
    @_events = @_events or {}
    return  if event of @_events is false
    @_events[event].splice @_events[event].indexOf(fct), 1
    return

  trigger: (event) -> # , args...
    @_events = @_events or {}
    return  if event of @_events is false
    i = 0

    while i < @_events[event].length
      @_events[event][i].apply this, Array::slice.call(arguments_, 1)
      i++
    return


#I know.
DrawingBoard.Utils._boxBorderSize = ($el, withPadding, withMargin, direction) ->
  withPadding = !!withPadding or true
  withMargin = !!withMargin or false
  width = 0
  props = undefined
  if direction is "width"
    props = [
      "border-left-width"
      "border-right-width"
    ]
    props.push "padding-left", "padding-right"  if withPadding
    props.push "margin-left", "margin-right"  if withMargin
  else
    props = [
      "border-top-width"
      "border-bottom-width"
    ]
    props.push "padding-top", "padding-bottom"  if withPadding
    props.push "margin-top", "margin-bottom"  if withMargin
  i = props.length - 1

  while i >= 0
    width += parseInt($el.css(props[i]).replace("px", ""), 10)
    i--
  width

DrawingBoard.Utils.boxBorderWidth = ($el, withPadding, withMargin) ->
  DrawingBoard.Utils._boxBorderSize $el, withPadding, withMargin, "width"

DrawingBoard.Utils.boxBorderHeight = ($el, withPadding, withMargin) ->
  DrawingBoard.Utils._boxBorderSize $el, withPadding, withMargin, "height"

DrawingBoard.Utils.isColor = (string) ->
  return false  if not string or not string.length
  (/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i).test(string) or $.inArray(string.substring(0, 3), [
    "rgb"
    "hsl"
  ]) isnt -1


###
Packs an RGB color into a single integer.
###
DrawingBoard.Utils.RGBToInt = (r, g, b) ->
  c = 0
  c |= (r & 255) << 16
  c |= (g & 255) << 8
  c |= (b & 255)
  c


###
Returns informations on the pixel located at (x,y).
###
DrawingBoard.Utils.pixelAt = (image, x, y) ->
  i = (y * image.width + x) * 4
  c = DrawingBoard.Utils.RGBToInt(image.data[i], image.data[i + 1], image.data[i + 2])
  [
    i # INDEX
    x # X
    y # Y
    c # COLOR
  ]


###
Compares two colors with the given tolerance (between 0 and 255).
###
DrawingBoard.Utils.compareColors = (a, b, tolerance) ->
  return (a is b)  if tolerance is 0
  ra = (a >> 16) & 255
  rb = (b >> 16) & 255
  ga = (a >> 8) & 255
  gb = (b >> 8) & 255
  ba = a & 255
  bb = b & 255
  (Math.abs(ra - rb) <= tolerance) and (Math.abs(ga - gb) <= tolerance) and (Math.abs(ba - bb) <= tolerance)

(->
  lastTime = 0
  vendors = [
    "ms"
    "moz"
    "webkit"
    "o"
  ]
  x = 0

  while x < vendors.length and not window.requestAnimationFrame
    window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"]
    window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] or window[vendors[x] + "CancelRequestAnimationFrame"]
    ++x
  return
)()
