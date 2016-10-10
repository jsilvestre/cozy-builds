// Generated by CoffeeScript 1.11.1
var LocalizationManager, Polyglot, cozydb, ext, fs, getTemplateExt, jade;

jade = require('jade');

fs = require('fs');

cozydb = require('cozydb');

Polyglot = require('node-polyglot');

getTemplateExt = require('../helpers/get_template_ext');

ext = getTemplateExt();

LocalizationManager = (function() {
  function LocalizationManager() {}

  LocalizationManager.prototype.polyglot = null;

  LocalizationManager.prototype.initialize = function(callback) {
    if (callback == null) {
      callback = function() {};
    }
    return this.retrieveLocale((function(_this) {
      return function(err, locale) {
        if (err != null) {
          _this.polyglot = _this.getPolyglotByLocale(null);
        } else {
          _this.polyglot = _this.getPolyglotByLocale(locale);
        }
        return callback(null, _this.polyglot);
      };
    })(this));
  };

  LocalizationManager.prototype.retrieveLocale = function(callback) {
    return cozydb.api.getCozyLocale(function(err, locale) {
      if ((err != null) || !locale) {
        locale = 'en';
      }
      return callback(err, locale);
    });
  };

  LocalizationManager.prototype.getPolyglotByLocale = function(locale) {
    var err, phrases;
    if (locale != null) {
      try {
        phrases = require("../locales/" + locale);
      } catch (error) {
        err = error;
        phrases = require('../locales/en');
      }
    } else {
      phrases = require('../locales/en');
    }
    return new Polyglot({
      locale: locale,
      phrases: phrases
    });
  };

  LocalizationManager.prototype.t = function(key, params) {
    var ref;
    if (params == null) {
      params = {};
    }
    return (ref = this.polyglot) != null ? ref.t(key, params) : void 0;
  };

  LocalizationManager.prototype.getEmailTemplate = function(name) {
    var getPath, templatePath;
    getPath = function(lang) {
      var filePath, templatefile;
      filePath = "../views/" + lang + "/" + name;
      templatefile = require('path').join(__dirname, filePath);
      if (ext !== 'jade') {
        templatefile = templatefile.replace('jade', 'js');
      }
      if (fs.existsSync(templatefile)) {
        return templatefile;
      } else {
        return null;
      }
    };
    templatePath = getPath(this.polyglot.currentLocale);
    if (templatePath == null) {
      templatePath = getPath('en');
    }
    if (ext === 'jade') {
      return jade.compile(fs.readFileSync(templatePath, 'utf8'));
    } else {
      return require(templatePath);
    }
  };

  LocalizationManager.prototype.getPolyglot = function() {
    return this.polyglot;
  };

  return LocalizationManager;

})();

module.exports = new LocalizationManager();
