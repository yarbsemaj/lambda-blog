'use strict';

const response = require("../../modules/http/response").default
const getPosts = require("../../modules/posts/get").default


module.exports.get = async event => {
  let id = event.pathParameters.id;

  let responseBody = await getPosts(id);
  if (responseBody && responseBody.status === 'published') {
    return response(responseBody, 200, 60 * 60 * 24 * 30); //Cache for 1 month
  } else {
    return response({ sucsess: false, "message": "Post not found" }, 404)
  }
};
