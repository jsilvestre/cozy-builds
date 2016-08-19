// Generated by CoffeeScript 1.10.0
var _, hasEmptyField;

_ = require('lodash');

hasEmptyField = module.exports.hasEmptyField = function(obj, keys) {
  var i, key, value;
  i = 0;
  while ((key = keys[i]) != null) {
    value = obj[key];
    if (!((value != null) && ((!_.isEmpty(value)) || (_.isBoolean(value)) || (_.isNumber(value))))) {
      return true;
    }
    i++;
  }
  return false;
};

module.exports.hasIncorrectStructure = function(set, keys) {
  var i, obj;
  i = 0;
  while ((obj = set[i]) != null) {
    if (hasEmptyField(obj, keys)) {
      return true;
    }
    i++;
  }
  return false;
};
