module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-mincss');

	grunt.initConfig({
		pkg: grunt.file.readJSON('bower.json'),
		meta: {
			banner: "/* <%= pkg.name %> v<%= pkg.version %> - https://github.com/Leimi/drawingboard.js\n" +
			"* Copyright (c) <%= grunt.template.today('yyyy') %> Emmanuel Pelletier\n" +
			'* Licensed MIT */'
		},
		concat: {
			light: {
				src: ['<banner>', 'js/drawingboard.js', 'js/board.js', 'js/utils.js'],
				dest: 'dist/drawingboard.nocontrol.js'
			},
			full: {
				src: ['<banner>', 'js/drawingboard.js', 'js/board.js', 'js/controls/control.js', 'js/controls/color.js', 'js/controls/navigation.js', 'js/controls/size.js', 'js/controls/download.js', 'js/utils.js'],
				dest: 'dist/drawingboard.js'
			},
			cssLight: { //simple copy in order to have everything in dist/
				src: ['css/drawingboard.nocontrol.css'],
				dest: 'dist/drawingboard.nocontrol.css'
			},
			cssFull: { //simple copy in order to have everything in dist/
				src: ['css/drawingboard.css'],
				dest: 'dist/drawingboard.css'
			}
		},
		min: {
			light: {
				src: ['<banner>', 'dist/drawingboard.nocontrol.js'],
				dest: 'dist/drawingboard.nocontrol.min.js'
			},
			full: {
				src: ['<banner>', 'dist/drawingboard.js'],
				dest: 'dist/drawingboard.min.js'
			}
		},
		mincss: {
			light: {
				files: {
					'dist/drawingboard.nocontrol.min.css': ['css/drawingboard.nocontrol.css']
				}
			},
			full: {
				files: {
					'dist/drawingboard.min.css': ['css/drawingboard.css']
				}
			}
		}
	});
	grunt.registerTask('default', 'concat min mincss');
};
