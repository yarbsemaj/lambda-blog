'use strict';

const response = require("../../modules/http/response").default
const update = require("../../modules/posts/update").default
const get = require("../../modules/posts/get").default

const schema = require("../../schema/posts").default;
const invalidate = require('../../modules/cloudfrount/invalidate').default

const Joi = require('joi');

module.exports.put = async event => {
  let id = event.pathParameters.id

  let body;
  try {
    body = JSON.parse(event.body)
    Joi.assert(body, schema)
  } catch (error) {
    return response({ message: error.message }, 400)
  }

  let oldPost = await get(id);

  let responseBody = await update(id, body, oldPost.status === 'draft' && body.status === 'published');

  //Clear cache
  if (body.status === 'published') {
    await invalidate([
      '/blog',
      '/blog.json',
      `/blog/${responseBody.id}`,
      `/blog/${responseBody.id}.json`,
      '/blog/api/posts',
      `/blog/api/posts/${responseBody.id}`,
    ])
  }
  return response(responseBody)
};
