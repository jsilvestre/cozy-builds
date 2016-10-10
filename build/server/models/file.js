// Generated by CoffeeScript 1.11.1
var Binary, File, Folder, async, cozydb, feed, fs, log, moment;

fs = require('fs');

cozydb = require('cozydb');

moment = require('moment');

async = require('async');

feed = require('../lib/feed');

log = require('printit')({
  prefix: 'file-model'
});

Folder = require('./folder');

Binary = require('./binary');

module.exports = File = cozydb.getModel('File', {
  path: String,
  name: String,
  docType: String,
  mime: String,
  creationDate: String,
  lastModification: String,
  "class": String,
  size: Number,
  binary: Object,
  checksum: String,
  modificationHistory: Object,
  clearance: cozydb.NoSchema,
  tags: [String],
  uploading: Boolean
});

File.all = function(params, callback) {
  return File.request("all", params, callback);
};

File.byFolder = function(params, callback) {
  return File.request("byFolder", params, callback);
};

File.byFullPath = function(params, callback) {
  return File.request("byFullPath", params, callback);
};

File.injectInheritedClearance = function(files, callback) {
  return async.map(files, function(file, cb) {
    var regularFile;
    regularFile = file.toObject();
    return file.getInheritedClearance(function(err, inheritedClearance) {
      regularFile.inheritedClearance = inheritedClearance;
      return cb(err, regularFile);
    });
  }, callback);
};

File.createNewFile = function(data, file, callback) {
  var attachBinary, index, keepAlive, upload;
  upload = true;
  attachBinary = function(newFile) {
    file.path = data.name;
    return newFile.attachBinary(file, {
      "name": "file"
    }, function(err, res, body) {
      upload = false;
      if (err) {
        return newFile.destroy(function(error) {
          return callback("Error attaching binary: " + err);
        });
      } else {
        return index(newFile);
      }
    });
  };
  index = function(newFile) {
    return newFile.index(["name"], function(err) {
      if (err) {
        console.log(err);
      }
      return callback(null, newFile);
    });
  };
  keepAlive = function() {
    if (upload) {
      feed.publish('usage.application', 'files');
      return setTimeout(function() {
        return keepAlive();
      }, 60 * 1000);
    }
  };
  return File.create(data, function(err, newFile) {
    if (err) {
      return callback(new Error("Server error while creating file; " + err));
    } else {
      attachBinary(newFile);
      return keepAlive();
    }
  });
};

File.prototype.getFullPath = function() {
  return this.path + '/' + this.name;
};

File.prototype.getPublicURL = function(cb) {
  return cozydb.api.getCozyDomain((function(_this) {
    return function(err, domain) {
      var url;
      if (err) {
        return cb(err);
      }
      url = domain + "public/files/files/" + _this.id + "/attach/" + _this.name;
      return cb(null, url);
    };
  })(this));
};

File.prototype.getParents = function(callback) {
  return Folder.all((function(_this) {
    return function(err, folders) {
      var fullPath, parents;
      if (err) {
        return callback(err);
      }
      fullPath = _this.getFullPath();
      parents = folders.filter(function(tested) {
        return fullPath.indexOf(tested.getFullPath()) === 0;
      });
      parents.sort(function(a, b) {
        return a.getFullPath().length - b.getFullPath().length;
      });
      return callback(null, parents);
    };
  })(this));
};

File.prototype.getInheritedClearance = function(callback) {
  return this.getParents(function(erer, parents) {
    var inherited, isPublic;
    if (typeof err !== "undefined" && err !== null) {
      return callback(err);
    }
    isPublic = false;
    inherited = parents != null ? parents.filter(function(parent) {
      if (parent.clearance == null) {
        parent.clearance = [];
      }
      if (isPublic) {
        return false;
      }
      if (parent.clearance === 'public') {
        isPublic = true;
      }
      return parent.clearance.length !== 0;
    }) : void 0;
    return callback(null, inherited);
  });
};

File.prototype.updateParentModifDate = function(callback) {
  return Folder.byFullPath({
    key: this.path
  }, function(err, parents) {
    var parent;
    if (err) {
      return callback(err);
    } else if (parents.length > 0) {
      parent = parents[0];
      parent.lastModification = moment().toISOString();
      return parent.save(callback);
    } else {
      return callback();
    }
  });
};

File.prototype.destroyWithBinary = function(callback) {
  var binary;
  if (this.binary != null) {
    binary = new Binary(this.binary.file);
    return binary.destroy((function(_this) {
      return function(err) {
        if (err) {
          log.error("Cannot destroy binary linked to document " + _this.id);
        }
        return _this.destroy(callback);
      };
    })(this));
  } else {
    return this.destroy(callback);
  }
};

if (process.env.NODE_ENV === 'test') {
  File.prototype.index = function(fields, callback) {
    return callback(null);
  };
  File.prototype.search = function(query, callback) {
    return callback(null, []);
  };
}
