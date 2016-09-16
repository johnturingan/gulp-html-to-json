/**
 * Created by isda on 16/09/2016.
 */

var gulp = require('gulp');
var g = require('gulp-load-plugins')();
var htmlToJson = require('../index.js');

/**
 * COMPILE AS JSON
 * Template Group filename would be the default filename
 * @return Json file
 */
gulp.task('compileA', function () {

    return gulp.src('./templateGroup/**/*.tpl')
        .pipe(htmlToJson({
            useAsVariable: false
            , isAngularTemplate : false
            , prefix : "YourPreferredPrefix"
        }))
        .pipe(gulp.dest('./output'))
        .on('error', g.util.log)
        ;
});

/**
 * COMPILE AS JS Object
 * Template Group filename would be the default filename
 * @return Js file
 */
gulp.task('compileB', function () {

    return gulp.src('./templateGroup/**/*.tpl')
        .pipe(htmlToJson({
            useAsVariable: true
            , isAngularTemplate : false
            , prefix : "YourPreferredPrefix"
        }))
        .pipe(gulp.dest('./output'))
        .on('error', g.util.log)
        ;
});


/**
 * FOR ANGULAR JS SUPPORT
 * Template Group filename would be the default filename
 * @return JS File
 */
gulp.task('compileC', function () {

    return gulp.src('./templateGroup/**/*.tpl')
        .pipe(htmlToJson({
            useAsVariable: true
            , isAngularTemplate : true
            , prefix : "YourPreferredPrefix"
        }))
        .pipe(gulp.dest('./output'))
        .on('error', g.util.log)
        ;
});

/**
 * COMPILE AS JSON but you want to use your preferred filename
 * @return Json file
 */
gulp.task('compileD', function () {

    return gulp.src('./templateGroup/**/*.tpl')
        .pipe(htmlToJson({
            filename : 'MyCustomFileName'
            , useAsVariable: false
            , isAngularTemplate : false
            , prefix : "YourPreferredPrefix"
        }))
        .pipe(gulp.dest('./output'))
        .on('error', g.util.log)
        ;
});