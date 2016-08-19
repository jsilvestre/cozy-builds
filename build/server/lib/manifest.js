// Generated by CoffeeScript 1.10.0
var cozydb, localizationManager, logger, request,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

request = require('request-json');

localizationManager = require('../helpers/localization_manager');

logger = require('printit')({
  prefix: 'manifest'
});

cozydb = require('cozydb');

exports.Manifest = (function() {
  function Manifest() {
    this.getMetaData = bind(this.getMetaData, this);
    this.getType = bind(this.getType, this);
    this.getIconPath = bind(this.getIconPath, this);
    this.getDescription = bind(this.getDescription, this);
    this.getVersion = bind(this.getVersion, this);
    this.getWidget = bind(this.getWidget, this);
    this.getPermissions = bind(this.getPermissions, this);
  }

  Manifest.prototype.download = function(app, callback) {
    var Provider, packageName, provider, providerName;
    if (app["package"] != null) {
      if (app["package"] === '[object Object]') {
        packageName = app.name;
        return this.downloadFromNpm(packageName, function(err, manifest) {
          if (!err) {
            return callback(null, manifest);
          }
          err = new Error("Application " + app.name + " manifest was lost");
          if (app.id) {
            return cozydb.updateAttributes('application', app.id, {
              state: 'broken',
              password: null,
              errormsg: err.message + ":\n " + err.stack,
              errorcode: 500
            }, function() {
              return callback(err);
            });
          } else {
            return callback(err);
          }
        });
      } else if (typeof app["package"] === 'string') {
        packageName = app["package"];
        return this.downloadFromNpm(packageName, callback);
      } else if (app["package"].type === 'npm') {
        packageName = app["package"].name;
        return this.downloadFromNpm(packageName, callback);
      } else {
        logger.warn("Cannot get manifest for " + app.name + ", wrong package type");
        this.config = {};
        return callback(null, {});
      }
    } else if (app.git != null) {
      providerName = app.git.match(/(github\.com|gitlab\.cozycloud\.cc)/);
      if (providerName == null) {
        logger.error("Unknown provider '" + app.git + "'");
        return callback("unknown provider");
      } else {
        providerName = providerName[0];
        if (providerName === "gitlab.cozycloud.cc") {
          Provider = require('./git_providers').CozyGitlabProvider;
        } else {
          Provider = require('./git_providers').GithubProvider;
        }
        provider = new Provider(app);
        return provider.getManifest((function(_this) {
          return function(err, data) {
            _this.config = {};
            if (err == null) {
              _this.config = data;
            }
            return callback(err, data);
          };
        })(this));
      }
    } else {
      this.config = {};
      logger.warn('App manifest without recognized git URL or package field');
      logger.raw(app);
      return callback(null, {});
    }
  };

  Manifest.prototype.downloadFromNpm = function(packageName, callback) {
    var client;
    client = request.createClient("https://registry.npmjs.org/");
    return client.get(packageName, (function(_this) {
      return function(err, res, data) {
        var manifest;
        if ((res != null ? res.statusCode : void 0) === 404) {
          return callback(localizationManager.t('manifest not found'));
        } else if (err) {
          return callback(err);
        } else {
          manifest = data.versions[data['dist-tags'].latest];
          _this.config = manifest;
          return callback(null, manifest);
        }
      };
    })(this));
  };

  Manifest.prototype.getPermissions = function() {
    var ref;
    if (((ref = this.config) != null ? ref["cozy-permissions"] : void 0) != null) {
      return this.config["cozy-permissions"];
    } else {
      return {};
    }
  };

  Manifest.prototype.getWidget = function() {
    if (this.config['cozy-widget'] != null) {
      return this.config["cozy-widget"];
    } else {
      return null;
    }
  };

  Manifest.prototype.getVersion = function() {
    var ref;
    if (((ref = this.config) != null ? ref['version'] : void 0) != null) {
      return this.config['version'];
    } else {
      return "0.0.0";
    }
  };

  Manifest.prototype.getDescription = function() {
    var ref;
    if (((ref = this.config) != null ? ref['description'] : void 0) != null) {
      return this.config["description"];
    } else {
      return null;
    }
  };

  Manifest.prototype.getIconPath = function() {
    var ref;
    if (((ref = this.config) != null ? ref['icon-path'] : void 0) != null) {
      return this.config['icon-path'];
    } else {
      return null;
    }
  };

  Manifest.prototype.getColor = function() {
    var ref;
    if (((ref = this.config) != null ? ref['cozy-color'] : void 0) != null) {
      return this.config['cozy-color'];
    } else {
      return null;
    }
  };

  Manifest.prototype.getType = function() {
    var ref;
    return ((ref = this.config) != null ? ref['cozy-type'] : void 0) || {};
  };

  Manifest.prototype.getMetaData = function() {
    var metaData, ref, ref1;
    metaData = {};
    if (this.config.description != null) {
      metaData.description = this.config.description;
    }
    if (this.config.name != null) {
      metaData.name = this.config.name.replace('cozy-', '');
    }
    if (this.config.slug != null) {
      metaData.slug = this.config.slug;
    }
    if (this.config['cozy-type'] != null) {
      metaData.type = this.config['cozy-type'];
    }
    if (this.config['cozy-displayName'] != null) {
      metaData.displayName = this.config['cozy-displayName'];
    } else {
      metaData.displayName = (ref = this.config.name) != null ? ref.replace('cozy-', '') : void 0;
      metaData.displayName = (ref1 = metaData.displayName) != null ? ref1.replace('-', ' ') : void 0;
    }
    if (this.config['icon-path'] != null) {
      metaData.iconPath = this.config['icon-path'];
    }
    if (this.config['cozy-permissions'] != null) {
      metaData.permissions = this.config['cozy-permissions'];
    }
    if (this.config['cozy-color']) {
      metaData.color = this.config['cozy-color'];
    }
    return metaData;
  };

  return Manifest;

})();
