'use strict';

const response = require("../../modules/http/response").default
const remove = require("../../modules/posts/remove").default
const invalidate = require('../../modules/cloudfrount/invalidate').default

module.exports.delete = async event => {
  let id = event.pathParameters.id;
  let responseBody = await remove(id)
  if (responseBody === true) {
    await invalidate([
      '/blog',
      '/blog.json',
      '/blog/api/posts'
    ])
    return response({ sucsess: true })
  } else {
    return response({ sucsess: false, "message": "Post not found" }, 404)
  }
};
