'use strict'

exports.default =(body, status = 200, cache = 0) => {
    return {
        statusCode: status,
        body: JSON.stringify(body),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
          'cache-control': `max-age=${cache}`
        },
  };
}