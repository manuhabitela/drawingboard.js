module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-mincss');

	grunt.initConfig({
		concat: {
			light: {
				src: ['js/drawingboard.js', 'js/board.js', 'js/utils.js'],
				dest: 'dist/drawingboard.nocontrol.js'
			},
			full: {
				src: ['js/drawingboard.js', 'js/board.js', 'js/controls/control.js', 'js/controls/color.js', 'js/controls/navigation.js', 'js/controls/size.js', 'js/controls/download.js', 'js/utils.js'],
				dest: 'dist/drawingboard.js'
			}
		},
		min: {
			light: {
				src: ['dist/drawingboard.nocontrol.js'],
				dest: 'dist/drawingboard.nocontrol.min.js'
			},
			full: {
				src: ['dist/drawingboard.js'],
				dest: 'dist/drawingboard.min.js'
			}
		},
		mincss: {
			dist: {
				files: {
					'dist/drawingboard.min.css': ['css/drawingboard.css']
				}
			}
		}
	});
	grunt.registerTask('default', 'concat min mincss');
};