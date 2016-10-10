// Generated by CoffeeScript 1.11.1
var cozydb;

cozydb = require('cozydb');

module.exports = {
  file: {
    all: cozydb.defaultRequests.all,
    byTag: cozydb.defaultRequests.tags,
    byFolder: cozydb.defaultRequests.by('path'),
    byFullPath: function(doc) {
      return emit(doc.path + '/' + doc.name, doc);
    }
  },
  folder: {
    all: cozydb.defaultRequests.all,
    byTag: cozydb.defaultRequests.tags,
    byFolder: cozydb.defaultRequests.by('path'),
    byFullPath: function(doc) {
      return emit(doc.path + '/' + doc.name, doc);
    }
  },
  contact: {
    all: cozydb.defaultRequests.all
  }
};
