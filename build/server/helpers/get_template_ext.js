// Generated by CoffeeScript 1.11.1
var fs, path;

fs = require('fs');

path = require('path');

module.exports = function() {
  var ext, filePath;
  filePath = path.resolve(__dirname, "../views/index.js");
  if (fs.existsSync(filePath)) {
    ext = 'js';
  } else {
    ext = 'jade';
  }
  return ext;
};
