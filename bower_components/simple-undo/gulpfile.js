var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var gulp   = require('gulp');

gulp.task('lint', function() {
  return gulp.src('./lib/simple-undo.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('test', function() {
    return gulp.src('./tests/simple-undo.js', {read: false})
        .pipe(mocha({reporter: 'spec'}));
});
