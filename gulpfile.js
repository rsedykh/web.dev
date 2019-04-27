const path = require('path');
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const sourcemaps = require('gulp-sourcemaps');
const sasslint = require('gulp-sass-lint');
const rename = require('gulp-rename');

/* eslint-disable max-len */
const assetTypes = `jpg,jpeg,png,svg,gif,webp,webm,mp4,mov,ogg,wav,mp3,txt,yaml`;
/* eslint-enable max-len */

gulp.task('lint-js', () => {
  return (
    gulp
      .src(['.eleventy.js', './src/**/*.js'])
      // eslint() attaches the lint output to the 'eslint' property
      // of the file object so it can be used by other modules.
      .pipe(eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach().
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
      .pipe(eslint.failAfterError())
  );
});

gulp.task('lint-scss', () => {
  return gulp
    .src('src/styles/**/*.scss')
    .pipe(sasslint())
    .pipe(sasslint.format())
    .pipe(sasslint.failOnError());
});

gulp.task('scss', () => {
  return (
    gulp
      .src('./src/styles/all.scss')
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      // Sourcemaps directory is relative to the output directory.
      // If output dir is './dist' this will place them in './dist/maps'.
      .pipe(sourcemaps.write('./maps'))
      .pipe(gulp.dest('./dist'))
  );
});

// These are images that our CSS refers to and must be checked in to DevSite.
gulp.task('copy-global-assets', () => {
  return gulp.src(['./src/images/**/*']).pipe(gulp.dest('./dist/images'));
});

// Images and any other assets in the content directory that should be copied
// over along with the posts themselves.
// Because we use permalinks to strip the parent directories form our posts
// we need to also strip them from the content paths.
gulp.task('copy-content-assets', () => {
  return gulp
    .src([
      `./src/site/content/en/**/*.{${assetTypes}}`,
    ])
    // This makes the images show up in the same spot as the permalinked posts
    // they belong to.
    .pipe(
      rename(function(assetPath) {
        const parts = assetPath.dirname.split('/');
        // Let the en/images directory pass through.
        if (parts[0] === 'images') {
          return;
        }
        return assetPath.dirname = path.basename(assetPath.dirname);
      })
    )
    .pipe(gulp.dest('./dist/en'));
});

let buildTask;
if (process.env.ELEVENTY_ENV === 'prod') {
  buildTask = gulp.parallel('copy-content-assets');
} else {
  buildTask = gulp.parallel(
    'scss',
    'copy-global-assets',
    'copy-content-assets',
  );
}
gulp.task('build', buildTask);

gulp.task('watch', () => {
  gulp.watch('./src/styles/**/*.scss', gulp.series('scss'));
  gulp.watch('./src/images/**/*', gulp.series('copy-global-assets'));
  gulp.watch(
    './src/site/content/**/*',
    gulp.series('copy-content-assets')
  );
});
