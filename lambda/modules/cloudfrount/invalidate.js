
var AWS = require('aws-sdk');
var randomstring = require('randomstring');


exports.default = (paths) => {
    var reference = randomstring.generate(16);
    var cloudfront = new AWS.CloudFront();
    return new Promise((resolve, reject) => {
        var params = {
            DistributionId: process.env.CF_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: reference,
                Paths: {
                    Quantity: paths.length,
                    Items: paths,
                }
            }
        };
        console.log(params);
        cloudfront.createInvalidation(params, function (err, data) {
            if (err) {
                console.log(err);
                reject(err);
                return;
            } else {
                console.log(data);
                resolve(data);
                return;
            };
        });
    });
}

