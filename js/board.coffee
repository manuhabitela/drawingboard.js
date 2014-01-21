window.DrawingBoard = (if typeof DrawingBoard isnt "undefined" then DrawingBoard else {})

###
pass the id of the html element to put the drawing board into
and some options : {
controls: array of controls to initialize with the drawingboard. 'Colors', 'Size', and 'Navigation' by default
instead of simple strings, you can pass an object to define a control opts
ie ['Color', { Navigation: { reset: false }}]
controlsPosition: "top left" by default. Define where to put the controls: at the "top" or "bottom" of the canvas, aligned to "left"/"right"/"center"
background: background of the drawing board. Give a hex color or an image url "#ffffff" (white) by default
color: pencil color ("#000000" by default)
size: pencil size (3 by default)
webStorage: 'session', 'local' or false ('session' by default). store the current drawing in session or local storage and restore it when you come back
droppable: true or false (false by default). If true, dropping an image on the canvas will include it and allow you to draw on it,
errorMessage: html string to put in the board's element on browsers that don't support canvas.
}
###
DrawingBoard.Board = (id, opts) ->
  @opts = @mergeOptions(opts)
  @ev = new DrawingBoard.Utils.MicroEvent()
  @id = id
  @$el = $(document.getElementById(id))
  return false  unless @$el.length
  tpl = "<div class=\"drawing-board-canvas-wrapper\"></canvas><canvas class=\"drawing-board-canvas\"></canvas><div class=\"drawing-board-cursor drawing-board-utils-hidden\"></div></div>"
  if @opts.controlsPosition.indexOf("bottom") > -1
    tpl += "<div class=\"drawing-board-controls\"></div>"
  else
    tpl = "<div class=\"drawing-board-controls\"></div>" + tpl
  @$el.addClass("drawing-board").append tpl
  @dom =
    $canvasWrapper: @$el.find(".drawing-board-canvas-wrapper")
    $canvas: @$el.find(".drawing-board-canvas")
    $cursor: @$el.find(".drawing-board-cursor")
    $controls: @$el.find(".drawing-board-controls")

  $.each [
    "left"
    "right"
    "center"
  ], $.proxy((n, val) ->
    if @opts.controlsPosition.indexOf(val) > -1
      @dom.$controls.attr "data-align", val
      false
  , this)
  @canvas = @dom.$canvas.get(0)
  @ctx = (if @canvas and @canvas.getContext and @canvas.getContext("2d") then @canvas.getContext("2d") else null)
  @color = @opts.color
  unless @ctx
    @$el.html @opts.errorMessage  if @opts.errorMessage
    return false
  @storage = @_getStorage()
  @initHistory()
  
  #init default board values before controls are added (mostly pencil color and size)
  @reset
    webStorage: false
    history: false
    background: false

  
  #init controls (they will need the default board values to work like pencil color and size)
  @initControls()
  
  #set board's size after the controls div is added
  @resize()
  
  #reset the board to take all resized space
  @reset
    webStorage: false
    history: true
    background: true

  @restoreWebStorage()
  @initDropEvents()
  @initDrawEvents()
  return

DrawingBoard.Board.defaultOpts =
  controls: [
    "Color"
    "DrawingMode"
    "Size"
    "Navigation"
  ]
  controlsPosition: "top left"
  color: "#000000"
  size: 1
  background: "#fff"
  eraserColor: "background"
  fillTolerance: 100
  webStorage: "session"
  droppable: false
  enlargeYourContainer: false
  errorMessage: "<p>It seems you use an obsolete browser. <a href=\"http://browsehappy.com/\" target=\"_blank\">Update it</a> to start drawing.</p>"

DrawingBoard.Board:: =
  mergeOptions: (opts) ->
    opts = $.extend({}, DrawingBoard.Board.defaultOpts, opts)
    opts.eraserColor = "transparent"  if not opts.background and opts.eraserColor is "background"
    opts

  
  ###
  Canvas reset/resize methods: put back the canvas to its default values
  
  depending on options, can set color, size, background back to default values
  and store the reseted canvas in webstorage and history queue
  
  resize values depend on the `enlargeYourContainer` option
  ###
  reset: (opts) ->
    opts = $.extend(
      color: @opts.color
      size: @opts.size
      webStorage: true
      history: true
      background: false
    , opts)
    @setMode "pencil"
    @resetBackground @opts.background, false  if opts.background
    @setColor opts.color  if opts.color
    @ctx.lineWidth = opts.size  if opts.size
    @ctx.lineCap = "round"
    @ctx.lineJoin = "round"
    
    # this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.width);
    @saveWebStorage()  if opts.webStorage
    @saveHistory()  if opts.history
    @blankCanvas = @getImg()
    @ev.trigger "board:reset", opts
    return

  resetBackground: (background, historize) ->
    background = background or @opts.background
    historize = (if typeof historize isnt "undefined" then historize else true)
    bgIsColor = DrawingBoard.Utils.isColor(background)
    prevMode = @getMode()
    @setMode "pencil"
    @ctx.clearRect 0, 0, @ctx.canvas.width, @ctx.canvas.width
    if bgIsColor
      @ctx.fillStyle = background
      @ctx.fillRect 0, 0, @ctx.canvas.width, @ctx.canvas.height
    else @setImg background  if background
    @setMode prevMode
    @saveHistory()  if historize
    return

  resize: ->
    @dom.$controls.toggleClass "drawing-board-controls-hidden", (not @controls or not @controls.length)
    canvasWidth = undefined
    canvasHeight = undefined
    widths = [
      @$el.width()
      DrawingBoard.Utils.boxBorderWidth(@$el)
      DrawingBoard.Utils.boxBorderWidth(@dom.$canvasWrapper, true, true)
    ]
    heights = [
      @$el.height()
      DrawingBoard.Utils.boxBorderHeight(@$el)
      @dom.$controls.height()
      DrawingBoard.Utils.boxBorderHeight(@dom.$controls, false, true)
      DrawingBoard.Utils.boxBorderHeight(@dom.$canvasWrapper, true, true)
    ]
    that = this
    sum = (values, multiplier) -> #make the sum of all array values
      multiplier = multiplier or 1
      res = values[0]
      i = 1

      while i < values.length
        res = res + (values[i] * multiplier)
        i++
      res

    sub = (values) -> #substract all array values from the first one
      sum values, -1

    if @opts.enlargeYourContainer
      canvasWidth = @$el.width()
      canvasHeight = @$el.height()
      @$el.width sum(widths)
      @$el.height sum(heights)
    else
      canvasWidth = sub(widths)
      canvasHeight = sub(heights)
    @dom.$canvasWrapper.css "width", canvasWidth + "px"
    @dom.$canvasWrapper.css "height", canvasHeight + "px"
    @dom.$canvas.css "width", canvasWidth + "px"
    @dom.$canvas.css "height", canvasHeight + "px"
    @canvas.width = canvasWidth
    @canvas.height = canvasHeight
    return

  
  ###
  Controls:
  the drawing board can has various UI elements to control it.
  one control is represented by a class in the namespace DrawingBoard.Control
  it must have a $el property (jQuery object), representing the html element to append on the drawing board at initialization.
  ###
  initControls: ->
    @controls = []
    return false  if not @opts.controls.length or not DrawingBoard.Control
    i = 0

    while i < @opts.controls.length
      c = null
      if typeof @opts.controls[i] is "string"
        c = new window["DrawingBoard"]["Control"][@opts.controls[i]](this)
      else if typeof @opts.controls[i] is "object"
        for controlName of @opts.controls[i]
          continue
        c = new window["DrawingBoard"]["Control"][controlName](this, @opts.controls[i][controlName])
      @addControl c  if c
      i++
    return

  
  #add a new control or an existing one at the position you want in the UI
  #to add a totally new control, you can pass a string with the js class as 1st parameter and control options as 2nd ie "addControl('Navigation', { reset: false }"
  #the last parameter (2nd or 3rd depending on the situation) is always the position you want to place the control at
  addControl: (control, optsOrPos, pos) ->
    return false  if typeof control isnt "string" and (typeof control isnt "object" or not control instanceof DrawingBoard.Control)
    opts = (if typeof optsOrPos is "object" then optsOrPos else {})
    pos = (if pos then pos * 1 else ((if typeof optsOrPos is "number" then optsOrPos else null)))
    control = new window["DrawingBoard"]["Control"][control](this, opts)  if typeof control is "string"
    if pos
      @dom.$controls.children().eq(pos).before control.$el
    else
      @dom.$controls.append control.$el
    @controls = []  unless @controls
    @controls.push control
    @dom.$controls.removeClass "drawing-board-controls-hidden"
    return

  
  ###
  History methods: undo and redo drawed lines
  ###
  initHistory: ->
    @history =
      values: []
      position: 0

    return

  saveHistory: ->
    while @history.values.length > 30
      @history.values.shift()
      @history.position--
    if @history.position isnt 0 and @history.position < @history.values.length
      @history.values = @history.values.slice(0, @history.position)
      @history.position++
    else
      @history.position = @history.values.length + 1
    @history.values.push @getImg()
    @ev.trigger "historyNavigation", @history.position
    return

  _goThroughHistory: (goForth) ->
    return  if (goForth and @history.position is @history.values.length) or (not goForth and @history.position is 1)
    pos = (if goForth then @history.position + 1 else @history.position - 1)
    if @history.values.length and @history.values[pos - 1]?
      @history.position = pos
      @setImg @history.values[pos - 1]
    @ev.trigger "historyNavigation", pos
    @saveWebStorage()
    return

  goBackInHistory: ->
    @_goThroughHistory false
    return

  goForthInHistory: ->
    @_goThroughHistory true
    return

  
  ###
  Image methods: you can directly put an image on the canvas, get it in base64 data url or start a download
  ###
  setImg: (src) ->
    ctx = @ctx
    img = new Image()
    oldGCO = ctx.globalCompositeOperation
    img.onload = ->
      ctx.globalCompositeOperation = "source-over"
      ctx.clearRect 0, 0, ctx.canvas.width, ctx.canvas.width
      ctx.drawImage img, 0, 0
      ctx.globalCompositeOperation = oldGCO
      return

    img.src = src
    return

  getImg: ->
    @canvas.toDataURL "image/png"

  downloadImg: ->
    img = @getImg()
    img = img.replace("image/png", "image/octet-stream")
    window.location.href = img
    return

  
  ###
  WebStorage handling : save and restore to local or session storage
  ###
  saveWebStorage: ->
    if window[@storage]
      window[@storage].setItem "drawing-board-" + @id, @getImg()
      @ev.trigger "board:save" + @storage.charAt(0).toUpperCase() + @storage.slice(1), @getImg()
    return

  restoreWebStorage: ->
    if window[@storage] and window[@storage].getItem("drawing-board-" + @id) isnt null
      @setImg window[@storage].getItem("drawing-board-" + @id)
      @ev.trigger "board:restore" + @storage.charAt(0).toUpperCase() + @storage.slice(1), window[@storage].getItem("drawing-board-" + @id)
    return

  clearWebStorage: ->
    if window[@storage] and window[@storage].getItem("drawing-board-" + @id) isnt null
      window[@storage].removeItem "drawing-board-" + @id
      @ev.trigger "board:clear" + @storage.charAt(0).toUpperCase() + @storage.slice(1)
    return

  _getStorage: ->
    return false  if not @opts.webStorage or not (@opts.webStorage is "session" or @opts.webStorage is "local")
    @opts.webStorage + "Storage"

  
  ###
  Drop an image on the canvas to draw on it
  ###
  initDropEvents: ->
    return false  unless @opts.droppable
    @dom.$canvas.on "dragover dragenter drop", (e) ->
      e.stopPropagation()
      e.preventDefault()
      return

    @dom.$canvas.on "drop", $.proxy(@_onCanvasDrop, this)
    return

  _onCanvasDrop: (e) ->
    e = (if e.originalEvent then e.originalEvent else e)
    files = e.dataTransfer.files
    return false  if not files or not files.length or files[0].type.indexOf("image") is -1 or not window.FileReader
    fr = new FileReader()
    fr.readAsDataURL files[0]
    fr.onload = $.proxy((ev) ->
      @setImg ev.target.result
      @ev.trigger "board:imageDropped", ev.target.result
      @ev.trigger "board:userAction"
      @saveHistory()
      return
    , this)
    return

  
  ###
  set and get current drawing mode
  
  possible modes are "pencil" (draw normally), "eraser" (draw transparent, like, erase, you know), "filler" (paint can)
  ###
  setMode: (newMode, silent) ->
    silent = silent or false
    newMode = newMode or "pencil"
    @ev.unbind "board:startDrawing", $.proxy(@fill, this)
    if @opts.eraserColor is "transparent"
      @ctx.globalCompositeOperation = (if newMode is "eraser" then "destination-out" else "source-over")
    else
      if newMode is "eraser"
        if @opts.eraserColor is "background" and DrawingBoard.Utils.isColor(@opts.background)
          @ctx.strokeStyle = @opts.background
        else @ctx.strokeStyle = @opts.eraserColor  if DrawingBoard.Utils.isColor(@opts.eraserColor)
      else @ctx.strokeStyle = @color  if not @mode or @mode is "eraser"
      @ev.bind "board:startDrawing", $.proxy(@fill, this)  if newMode is "filler"
    @mode = newMode
    @ev.trigger "board:mode", @mode  unless silent
    return

  getMode: ->
    @mode or "pencil"

  setColor: (color) ->
    that = this
    color = color or @color
    return false  unless DrawingBoard.Utils.isColor(color)
    @color = color
    if @opts.eraserColor isnt "transparent" and @mode is "eraser"
      setStrokeStyle = (mode) ->
        that.strokeStyle = that.color  if mode isnt "eraser"
        that.ev.unbind "board:mode", setStrokeStyle
        return

      @ev.bind "board:mode", setStrokeStyle
    else
      @ctx.strokeStyle = @color
    return

  
  ###
  Fills an area with the current stroke color.
  ###
  fill: (e) ->
    if @getImg() is @blankCanvas
      @ctx.clearRect 0, 0, @ctx.canvas.width, @ctx.canvas.width
      @ctx.fillStyle = @color
      @ctx.fillRect 0, 0, @ctx.canvas.width, @ctx.canvas.height
      return
    img = @ctx.getImageData(0, 0, @canvas.width, @canvas.height)
    
    # constants identifying pixels components
    INDEX = 0
    X = 1
    Y = 2
    COLOR = 3
    
    # target color components
    stroke = @ctx.strokeStyle
    r = parseInt(stroke.substr(1, 2), 16)
    g = parseInt(stroke.substr(3, 2), 16)
    b = parseInt(stroke.substr(5, 2), 16)
    
    # starting point
    start = DrawingBoard.Utils.pixelAt(img, parseInt(e.coords.x, 10), parseInt(e.coords.y, 10))
    startColor = start[COLOR]
    tolerance = @opts.fillTolerance
    
    # no need to continue if starting and target colors are the same
    return  if DrawingBoard.Utils.compareColors(startColor, DrawingBoard.Utils.RGBToInt(r, g, b), tolerance)
    
    # pixels to evaluate
    queue = [start]
    
    # loop vars
    pixel = undefined
    x = undefined
    y = undefined
    maxX = img.width - 1
    maxY = img.height - 1
    while (pixel = queue.pop())
      if DrawingBoard.Utils.compareColors(pixel[COLOR], startColor, tolerance)
        img.data[pixel[INDEX]] = r
        img.data[pixel[INDEX] + 1] = g
        img.data[pixel[INDEX] + 2] = b
        # west
        queue.push DrawingBoard.Utils.pixelAt(img, pixel[X] - 1, pixel[Y])  if pixel[X] > 0
        # east
        queue.push DrawingBoard.Utils.pixelAt(img, pixel[X] + 1, pixel[Y])  if pixel[X] < maxX
        # north
        queue.push DrawingBoard.Utils.pixelAt(img, pixel[X], pixel[Y] - 1)  if pixel[Y] > 0
        # south
        queue.push DrawingBoard.Utils.pixelAt(img, pixel[X], pixel[Y] + 1)  if pixel[Y] < maxY
    @ctx.putImageData img, 0, 0
    return

  
  ###
  Drawing handling, with mouse or touch
  ###
  initDrawEvents: ->
    @isDrawing = false
    @isMouseHovering = false
    @coords = {}
    @coords.old = @coords.current = @coords.oldMid =
      x: 0
      y: 0

    @dom.$canvas.on "mousedown touchstart", $.proxy((e) ->
      @_onInputStart e, @_getInputCoords(e)
      return
    , this)
    @dom.$canvas.on "mousemove touchmove", $.proxy((e) ->
      @_onInputMove e, @_getInputCoords(e)
      return
    , this)
    @dom.$canvas.on "mousemove", $.proxy((e) ->
      return
    , this)
    @dom.$canvas.on "mouseup touchend", $.proxy((e) ->
      @_onInputStop e, @_getInputCoords(e)
      return
    , this)
    @dom.$canvas.on "mouseover", $.proxy((e) ->
      @_onMouseOver e, @_getInputCoords(e)
      return
    , this)
    @dom.$canvas.on "mouseout", $.proxy((e) ->
      @_onMouseOut e, @_getInputCoords(e)
      return
    , this)
    $("body").on "mouseup touchend", $.proxy((e) ->
      @isDrawing = false
      return
    , this)
    requestAnimationFrame $.proxy(@draw, this)  if window.requestAnimationFrame
    return

  draw: ->
    
    #if the pencil size is big (>10), the small crosshair makes a friend: a circle of the size of the pencil
    #todo: have the circle works on every browser - it currently should be added only when CSS pointer-events are supported
    #we assume that if requestAnimationFrame is supported, pointer-events is too, but this is terribad.
    if window.requestAnimationFrame and @ctx.lineWidth > 10 and @isMouseHovering
      @dom.$cursor.css
        width: @ctx.lineWidth + "px"
        height: @ctx.lineWidth + "px"

      transform = DrawingBoard.Utils.tpl("translateX({{x}}px) translateY({{y}}px)",
        x: @coords.current.x - (@ctx.lineWidth / 2)
        y: @coords.current.y - (@ctx.lineWidth / 2)
      )
      @dom.$cursor.css
        transform: transform
        "-webkit-transform": transform
        "-ms-transform": transform

      @dom.$cursor.removeClass "drawing-board-utils-hidden"
    else
      @dom.$cursor.addClass "drawing-board-utils-hidden"
    if @isDrawing
      currentMid = @_getMidInputCoords(@coords.current)
      @ctx.beginPath()
      @ctx.moveTo currentMid.x, currentMid.y
      @ctx.quadraticCurveTo @coords.old.x, @coords.old.y, @coords.oldMid.x, @coords.oldMid.y
      @ctx.stroke()
      @coords.old = @coords.current
      @coords.oldMid = currentMid
    if window.requestAnimationFrame
      requestAnimationFrame $.proxy(->
        @draw()
        return
      , this)
    return

  _onInputStart: (e, coords) ->
    @coords.current = @coords.old = coords
    @coords.oldMid = @_getMidInputCoords(coords)
    @isDrawing = true
    @draw()  unless window.requestAnimationFrame
    @ev.trigger "board:startDrawing",
      e: e
      coords: coords

    e.stopPropagation()
    e.preventDefault()
    return

  _onInputMove: (e, coords) ->
    @coords.current = coords
    @ev.trigger "board:drawing",
      e: e
      coords: coords

    @draw()  unless window.requestAnimationFrame
    e.stopPropagation()
    e.preventDefault()
    return

  _onInputStop: (e, coords) ->
    if @isDrawing and (not e.touches or e.touches.length is 0)
      @isDrawing = false
      @saveWebStorage()
      @saveHistory()
      @ev.trigger "board:stopDrawing",
        e: e
        coords: coords

      @ev.trigger "board:userAction"
      e.stopPropagation()
      e.preventDefault()
    return

  _onMouseOver: (e, coords) ->
    @isMouseHovering = true
    @coords.old = @_getInputCoords(e)
    @coords.oldMid = @_getMidInputCoords(@coords.old)
    @ev.trigger "board:mouseOver",
      e: e
      coords: coords

    return

  _onMouseOut: (e, coords) ->
    @isMouseHovering = false
    @ev.trigger "board:mouseOut",
      e: e
      coords: coords

    return

  _getInputCoords: (e) ->
    e = (if e.originalEvent then e.originalEvent else e)
    x = undefined
    y = undefined
    if e.touches and e.touches.length is 1
      x = e.touches[0].pageX
      y = e.touches[0].pageY
    else
      x = e.pageX
      y = e.pageY
    x: x - @dom.$canvas.offset().left
    y: y - @dom.$canvas.offset().top

  _getMidInputCoords: (coords) ->
    x: @coords.old.x + coords.x >> 1
    y: @coords.old.y + coords.y >> 1
