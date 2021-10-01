'use strict';

const response = require("../../modules/http/response").default
const listPosts = require("../../modules/posts/listByStatus").default


module.exports.list = async event => {
  let published = await listPosts()
  let draft = await listPosts('draft')
  return response({published, draft})
};
