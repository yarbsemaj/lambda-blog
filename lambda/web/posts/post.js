'use strict';

const response = require("../../modules/http/response").default
const create = require("../../modules/posts/create").default
const schema = require("../../schema/posts").default;
const Joi = require('joi');
const invalidate = require('../../modules/cloudfrount/invalidate').default

module.exports.post = async event => {
  let body
  try {
    body = JSON.parse(event.body)
    Joi.assert(body, schema)
  } catch {
    return response({ error: "bad-request" }, 400)
  }
  let responseBody = await create(body);

  //Clear cache
  if(body.status === 'published'){
    await invalidate([
      '/blog',
      '/blog.json',
      '/blog/api/posts'
    ])
  }
  return response(responseBody)
};
