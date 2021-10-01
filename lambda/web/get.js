'use strict';

const response = require("../modules/http/response").default

module.exports.get = async event => {  
  return response({"hello":"world"})
};
