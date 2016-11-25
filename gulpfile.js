/*!
 * tncBoilerplate
 * https://github.com/mavisland/tncBoilerplate
 * Copyright 2016 Tanju Yıldız
 * Licensed under MIT license (https://github.com/mavisland/tncBoilerplate/blob/master/LICENSE.md)
 */

'use strict';

// Required packages
var gulp        = require('gulp');
var pkg         = require('./package.json');
var del         = require('del');
var filesys     = require('fs');
var bowerFiles  = require('main-bower-files');
var browserSync = require('browser-sync').create();
var archiver    = require('gulp-archiver');
var clean       = require("gulp-clean");
var cleanCSS    = require('gulp-clean-css');
var concat      = require('gulp-concat');
var ejs         = require("gulp-ejs");
var header      = require('gulp-header');
var less        = require('gulp-less');
var rename      = require("gulp-rename");
var uglify      = require('gulp-uglify');
var gutil       = require('gulp-util');

// Get Timestamp
var getTimestamp = function() {
  var date       = new Date();

  var dateYear   = date.getFullYear().toString();
  var dateMonth  = ('0' + (date.getMonth() + 1)).slice(-2);
  var dateDay    = ('0' + date.getDate()).slice(-2);
  var timeHour   = date.getHours().toString();
  var timeMinute = date.getMinutes().toString();
  var timeSecond = date.getSeconds().toString();

  return dateYear + dateMonth + dateDay + '-' + timeHour + timeMinute + timeSecond;
};

// Error Handling
var onError = function (err) {
  gutil.log(gutil.colors.red(err));
};

// Set the banner content
var banner = ['/*!\n',
  ' * tncBoilerplate v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
  ' * <%= pkg.description %>\n',
  ' *\n',
  ' * Copyright (c) ' + (new Date()).getFullYear(), ' <%= pkg.author.name %> <<%= pkg.author.email %>> \n',
  ' * Licensed under the <%= pkg.license.type %> license (<%= pkg.license.url %>)\n' +
  ' */\n',
  ''
].join('');

// Path Variables
var paths = {
  archive    : 'archive/',
  assets     : 'src/assets/',
  bower      : 'bower_components/',
  build      : 'dist/',
  components : 'src/components/',
  data       : 'src/data/',
  scripts    : 'src/js/',
  styles     : 'src/less/',
  templates  : "src/templates/"
};

// Input files variables
var inputFiles = {
  archiveFileName    : pkg.name + '_' + getTimestamp() + '.zip',
  buildFiles         : paths.build + "**",
  lessEntryPointFile : paths.styles + "style.less",
  lessFiles          : paths.styles + "**/*.less",
  htmlConfigJSON     : paths.data + "data.json",
  htmlInputFiles     : [
    paths.templates + '*.ejs',
    '!' + paths.templates + '_*.ejs'
  ],
  jsInputFiles       : [
    paths.components + 'components-bootstrap/js/transition.js',
    paths.components + 'components-bootstrap/js/alert.js',
    paths.components + 'components-bootstrap/js/button.js',
    paths.components + 'components-bootstrap/js/carousel.js',
    paths.components + 'components-bootstrap/js/collapse.js',
    paths.components + 'components-bootstrap/js/dropdown.js',
    paths.components + 'components-bootstrap/js/modal.js',
    paths.components + 'components-bootstrap/js/tooltip.js',
    paths.components + 'components-bootstrap/js/popover.js',
    paths.components + 'components-bootstrap/js/scrollspy.js',
    paths.components + 'components-bootstrap/js/tab.js',
    paths.components + 'components-bootstrap/js/affix.js',
    paths.components + 'magnific-popup/jquery.magnific-popup.min.js',
    paths.components + 'owl-carousel/owl.carousel.min.js',
    paths.scripts + 'scripts.js'
  ],
  jsOutputFileName : pkg.name + ".js"
};

// Archive build directory
gulp.task('archive', function () {
  gutil.log(gutil.colors.yellow('Packaging generated files. File path: archive/' + inputFiles.archiveFileName));

  return gulp.src(inputFiles.buildFiles)
    .pipe(archiver(inputFiles.archiveFileName))
    .pipe(gulp.dest(paths.archive));
});

// Clean build directory
gulp.task("clean", function () {
  gutil.log(gutil.colors.yellow('Cleaning generated files.'));

  return gulp.src(paths.build, {read: false})
    .pipe(clean());
});

// Copy vendor libraries from 'bower_components' into 'components'
gulp.task('components', function() {
  return gulp.src(bowerFiles(), {
    base: 'bower_components'
  })
    .pipe(gulp.dest(paths.components));
});

// Compile LESS files from /less into /css
gulp.task('less', function() {
  gutil.log(gutil.colors.yellow('Compiling LESS files to CSS files.'));

  return gulp.src(inputFiles.lessEntryPointFile)
    .pipe(less({
      paths: ["."] // Specify search paths for @import directives
    }))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest(paths.build + 'css/'))
    // Minify compiled CSS
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.build + 'css/'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Concatenates JS files and minified
gulp.task('js', function() {
  gutil.log(gutil.colors.yellow('Minifying JS files.'));

  return gulp.src(inputFiles.jsInputFiles)
    .pipe(header(banner, { pkg: pkg }))
    .pipe(concat(inputFiles.jsOutputFileName))
    .pipe(gulp.dest(paths.build + 'js/'))
    // Minify JS
    .pipe(uglify())
    .pipe(header(banner, { pkg: pkg }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.build + 'js/'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Compile all EJS templates to HTML
var json = JSON.parse(filesys.readFileSync(inputFiles.htmlConfigJSON)); // parse json
gulp.task("templates", function() {
  gutil.log(gutil.colors.yellow('Compiling EJS templates to HTML files.'));

  return gulp.src(inputFiles.htmlInputFiles)
    .pipe(ejs(json, {ext:'.html'}).on('error', gutil.log))
    .pipe(gulp.dest(paths.build))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Copy vendor files from 'components' into 'dist'
gulp.task('copy', function() {
  // Modernizr
  gulp.src('src/components/modernizr/modernizr.js')
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.build + 'js/'));

  // Vendor Javascript files
  gulp.src([
    paths.components + 'jquery/jquery.min.js'
  ])
    .pipe(gulp.dest(paths.build + 'js/'));

  // Icon fonts
  gulp.src([
    paths.components + 'bootstrap/fonts/*.{eot,svg,ttf,woff,woff2}',
    paths.components + 'font-awesome/fonts/*.{eot,svg,ttf,woff,woff2}'
  ])
    .pipe(gulp.dest(paths.build + 'fonts/'));

  // Images
  gulp.src([
    paths.components + 'owl.carousel/dist/assets/*.{gif,png}',
    paths.assets + 'images/*'
  ])
    .pipe(gulp.dest(paths.build + 'images/'));

  // humans.txt / robots.txt
  gulp.src([
    paths.assets + 'humans.txt',
    paths.assets + 'robots.txt'
  ])
    .pipe(gulp.dest(paths.build));
});

// Configure the browserSync task
gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: paths.build,
      index: "index.html"
    }
  });
});

// Reload Browser
gulp.task('bsReload', function() {
  return browserSync.reload();
});

// Run everything
gulp.task('default', ['clean', 'browserSync'], function() {
  gulp.start('dev');
});

// Dev task with browserSync
gulp.task('dev', ['copy', 'templates', 'less', 'js'], function() {
  gulp.watch(inputFiles.lessFiles, ['less']);
  gulp.watch(inputFiles.jsInputFiles, ['js']);
  gulp.watch([inputFiles.htmlConfigJSON, paths.templates + '*.ejs'], ['templates', 'bsReload']);
  // Reloads the browser whenever HTML, CSS or JS files change
  gulp.watch(paths.build + '*.html', ['bsReload']);
  gulp.watch([paths.build + 'css/*.css', '!' + paths.build + 'css/*.min.css'], ['bsReload']);
  gulp.watch([paths.build + 'js/*.js', '!' + paths.build + 'js/*.min.js'], ['bsReload']);
});
