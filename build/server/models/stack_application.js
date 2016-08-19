// Generated by CoffeeScript 1.10.0
var Manifest, StackApplication, cozydb;

cozydb = require('cozydb');

Manifest = require('../lib/manifest').Manifest;

module.exports = StackApplication = cozydb.getModel('StackApplication', {
  name: String,
  version: String,
  lastVersion: String,
  "package": cozydb.NoSchema,
  git: String
});

StackApplication.all = function(params, callback) {
  return StackApplication.request("all", params, callback);
};

StackApplication.prototype.checkForUpdate = function(callback) {
  var manifest, setFlag;
  setFlag = (function(_this) {
    return function(repoVersion, cb) {
      return _this.updateAttributes({
        lastVersion: repoVersion
      }, function(err) {
        if (err) {
          return cb(err);
        } else {
          return cb();
        }
      });
    };
  })(this);
  manifest = new Manifest();
  manifest["package"] = "cozy-" + this.name;
  return manifest.download(this, (function(_this) {
    return function(err) {
      var repoVersion;
      if (err) {
        return callback(err);
      } else {
        repoVersion = manifest.getVersion();
        if (repoVersion == null) {
          return callback(null, false);
        } else {
          return setFlag(repoVersion, function(err) {
            if (err != null) {
              return callback(err);
            }
            if ((_this.version == null) || _this.version !== repoVersion) {
              return callback(null, true);
            } else {
              return callback(null, false);
            }
          });
        }
      }
    };
  })(this));
};
