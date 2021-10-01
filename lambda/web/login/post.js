'use strict';

const response = require("../../modules/http/response").default

module.exports.post = async event => {  
  return response({"success": true})
};
