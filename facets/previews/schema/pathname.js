'use strict';

var Joi = require('joi');

var PATHNAME_REGEX = /^\/?[-._~!$&'()*+,;=:@a-zA-Z0-9]+(?:\/[-._~!$&'()*+,;=:@a-zA-Z0-9]+)*\/?$/;


module.exports = Joi.string().regex(PATHNAME_REGEX).allow('');
module.exports.regex = PATHNAME_REGEX;