module.exports = (grunt) ->
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-cssmin"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-coffeelint"
  grunt.initConfig
    bwr: grunt.file.readJSON("bower.json")
    meta:
      banner: "/* <%= bwr.name %> v<%= bwr.version %> - https://github.com/Leimi/drawingboard.js\n" + "* Copyright (c) <%= grunt.template.today('yyyy') %> Emmanuel Pelletier\n" + "* Licensed MIT */\n"

    coffeelint:
      app: 
        options:
          'max_line_length':
            level: 'ignore'
        files: 
          src: ['js/**/*.coffee']
      
    coffee:
      compileJoined:
        options:
          join: true
        files:
          'dist/drawingboard.js': "js/*.coffee"
          'dist/drawingboard.nocontrol.js': ["js/*.coffee", "js/controls/*.coffee"]
 
    concat:
      options:
        banner: "<%= meta.banner %>"

      cssLight: #simple copy in order to have everything in dist/
        src: ["css/drawingboard.nocontrol.css"]
        dest: "dist/drawingboard.nocontrol.css"

      cssFull: #simple copy in order to have everything in dist/
        src: ["css/drawingboard.css"]
        dest: "dist/drawingboard.css"

    uglify:
      options:
        banner: "<%= meta.banner %>"
        report: "gzip"

      light:
        files:
          "dist/drawingboard.nocontrol.min.js": ["dist/drawingboard.nocontrol.js"]

      full:
        files:
          "dist/drawingboard.min.js": ["dist/drawingboard.js"]

    cssmin:
      options:
        banner: "<%= meta.banner %>"

      light:
        files:
          "dist/drawingboard.nocontrol.min.css": ["css/drawingboard.nocontrol.css"]

      full:
        files:
          "dist/drawingboard.min.css": ["css/drawingboard.css"]

  grunt.registerTask "default", [
    "coffeelint"
    "coffee"
    "concat"
    "uglify"
    "cssmin"
  ]
  return
