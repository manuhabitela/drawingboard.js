module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-mincss');

	grunt.initConfig({
		concat: {
			light: {
				src: ['js/drawingboard.js', 'js/utils.js', 'js/board.js'],
				dest: 'dist/drawingboard.js'
			},
			full: {
				src: ['js/drawingboard.js', 'js/utils.js', 'js/board.js', 'js/controls/control.js', 'js/controls/color.js', 'js/controls/navigation.js', 'js/controls/size.js', 'js/controls/download.js'],
				dest: 'dist/drawingboard.full.js'
			}
		},
		min: {
			light: {
				src: ['dist/drawingboard.js'],
				dest: 'dist/drawingboard.min.js'
			},
			full: {
				src: ['dist/drawingboard.full.js'],
				dest: 'dist/drawingboard.full.min.js'
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