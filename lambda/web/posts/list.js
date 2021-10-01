'use strict';

const response = require("../../modules/http/response").default
const listPosts = require("../../modules/posts/listByStatus").default


module.exports.list = async event => {  
  let published = await listPosts()
  return response({published}, 200, 60 * 60 * 24 * 30); //Cache for 1 month
};
