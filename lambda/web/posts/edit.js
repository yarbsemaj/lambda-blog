'use strict';

const response = require("../../modules/http/response").default
const getPosts = require("../../modules/posts/get").default


module.exports.get = async event => { 
  let id = event.pathParameters.id;
 
  let responseBody = await getPosts(id);
  if(responseBody){
    return response(responseBody)
  }else{
    return response({sucsess:false,"message":"Post not found"},404)
  }
};
