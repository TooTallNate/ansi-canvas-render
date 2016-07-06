/**
 * Module dependencies.
 */

var ansi = require('ansi');

/**
 * Module exports.
 */

module.exports = render;

/**
 * Renders the <canvas> current context to the TTY.
 *
 * @api public
 */

function render (canvas, opts) {
  if (!canvas) {
    throw new TypeError('A Canvas instance must be given!');
  }
  if (!opts) {
    opts = {};
  }
  var stream = opts.stream || process.stdout;
  var small = null == opts.small ? true : !!opts.small;

  var cursor = ansi(stream);

  var pixelHeight = small ? 0.5 : 1;
  var pixelWidth = small ? 1 : 2;

  // retain calls in memory until `flush()` call
  cursor.buffer();

  // render the current <canvas> contents to the TTY
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var alphaThreshold = 0;

  var data = ctx.getImageData(0, 0, w, h).data;
  var r, g, b, alpha;
  var topBlank, bottomBlank;
  var i = 0;

  for (var y = 0; y < h; y++) {

    for (var x = 0; x < w; x++) {

      // in `small` mode, we have to render 2 rows at a time, where the top row
      // is the background color, and the bottom row is the foreground color
      i = ((y * w) + x) * 4;

      // top row
      r = data[i];
      g = data[i+1];
      b = data[i+2];
      alpha = data[i+3];

      if (alpha > alphaThreshold) {
        cursor.bg.rgb(r, g, b);
        topBlank = false;
      } else {
        cursor.bg.reset();
        topBlank = true;
      }

      if (small) {
        // bottom row

        // go to the next row
        i = (((y + 1) * w) + x) * 4;

        r = data[i];
        g = data[i+1];
        b = data[i+2];
        alpha = data[i+3];

        if (alpha > alphaThreshold) {
          cursor.fg.rgb(r, g, b);
          bottomBlank = false;
        } else {
          cursor.fg.reset();
          bottomBlank = true;
        }
      }

      if (small && bottomBlank && !topBlank) {
        // swapping fg and bg for this pixel since we're gonna use a "top
        // half" instead of the usual "bottom half"
        i = ((y * w) + x) * 4;

        // top row
        r = data[i];
        g = data[i+1];
        b = data[i+2];

        cursor.bg.reset();
        cursor.fg.rgb(r, g, b);
      }

      // write the pixel
      if (!small) {
        cursor.write('  ');
      } else if (topBlank && bottomBlank) {
        cursor.write(' ');
      } else if (bottomBlank) {
        cursor.write('▀');
      } else {
        cursor.write('▄');
      }
    }

    if (small) y++;

    // beginning of the row
    cursor.bg.reset();
    cursor.write('\n');
  }

  cursor.fg.reset();
  cursor.bg.reset();

  cursor.flush();
}
