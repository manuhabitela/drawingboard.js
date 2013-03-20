module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-mincss');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.initConfig({
		concat: {
			dist: {
				src: ['js/drawingboard.js', 'js/utils.js', 'js/controls/colors.js', 'js/controls/navigation.js', 'js/controls/size.js', 'js/controls/download.js'],
				dest: 'dist/drawingboard.js'
			}
		},
		min: {
			dist: {
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
		},
		watch: {
			scripts: {
				files: ['lib/*.js', 'js/**/*.js'],
				tasks: ['concat']
			},
			css: {
				files: ['css/*.css'],
				tasks: ['mincss']
			}
		}
	});
	grunt.registerTask('default', 'concat min mincss');
};