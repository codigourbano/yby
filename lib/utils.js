/**
 * Formats mongoose errors into proper array
 *
 * @param {Array} errors
 * @return {Array}
 * @api public
 */

exports.errors = function (errors) {
  var keys = Object.keys(errors);
  var errs = [];

  // if there is no validation error, just display a generic error
  if (!keys) {
    return ['Oops! There was an error'];
  }

  keys.forEach(function (key) {
    errs.push({ type: 'error', text: errors[key].message });
  });

  return errs;
};

/**
 * Formats mongoose errors into JSON array
 *
 * @param {Array} errors
 * @return {Array}
 * @api public
 */

exports.errorsAsJSON = function (errors) {
  var keys = Object.keys(errors);

  // if there is no validation error, just display a generic error
  if (!keys) {
    return { messages: [{ status: 'error', message: 'Houve um erro.' }] };
  }

  var json = {};
  json.messages = [];

  keys.forEach(function (key) {
    json.messages.push({ status: 'error', text: errors[key].message });
  });

  return json;
};

exports.errorMessagesFlash = function (errors) {
  var keys = Object.keys(errors);
  var errs = [];

  // if there is no validation error, just display a generic error
  if (!keys) {
    return ['Oops! There was an error'];
  }

  keys.forEach(function (key) {
    errs.push(errors[key].message);
  });

  return errs;
};

exports.errorMessages = function (errors) {
  if (errors.errors) {
    errors = errors.errors;
  }

  var keys = Object.keys(errors);
  var errs = [];

  // if there is no validation error, just display a generic error
  if (!keys) {
    return ['Oops! There was an error'];
  }

  keys.forEach(function (key) {
    errs.push({ status: 'error', text: errors[key].message });
  });

  return { messages: errs };
};

/**
 * Index of object within an array
 *
 * @param {Array} arr
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.indexof = function (arr, obj) {
  var index = -1; // not found initially
  // var keys = Object.keys(obj);
  // filter the collection with the given criterias
  // var result = arr.filter(function (doc, idx) {
  //   // keep a counter of matched key/value pairs
  //   var matched = 0;

  //   // loop over criteria
  //   for (var i = keys.length - 1; i >= 0; i--) {
  //     if (doc[keys[i]] === obj[keys[i]]) {
  //       matched++;

  //       // check if all the criterias are matched
  //       if (matched === keys.length) {
  //         index = idx;
  //         return idx;
  //       }
  //     }
  //   }
  // });
  return index;
};

/**
 * Find object in an array of objects that matches a condition
 *
 * @param {Array} arr
 * @param {Object} obj
 * @param {Function} cb - optional
 * @return {Object}
 * @api public
 */

exports.findByParam = function (arr, obj, cb) {
  var index = exports.indexof(arr, obj);
  if (~index && typeof cb === 'function') {
    return cb(undefined, arr[index]);
  } else if (~index && !cb) {
    return arr[index];
  } else if (!~index && typeof cb === 'function') {
    return cb(Error('not found'));
  }
  // else undefined is returned
};

exports.isInt = function (value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
};
