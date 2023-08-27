var AWS = require('aws-sdk');
var randomstring = require('randomstring');

exports.handler = async (event, context, callback) => {

    for (let record of event.Records) {
        console.log('Stream record: ', JSON.stringify(record, null, 2));

        switch (record.eventName) {
            case 'INSERT':
            case 'REMOVE':
                await triggerInvalidation([
                    '/blog',
                    '/blog.json'
                ]);
                break;
            case 'MODIFY':
                var pageID = record.dynamodb.NewImage.id.S
                await triggerInvalidation([
                    '/blog',
                    '/blog.json',
                    `/blog/${pageID}`,
                    `/blog/${pageID}.json`,
                ]);
        }
    };
    callback(null, `Successfully processed ${event.Records.length} records.`);
};


function triggerInvalidation(paths) {
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
        cloudfront.createInvalidation(params, function (err, data) {
            if (err) {
                console.log(err);
                reject(err);
                return;
            } else {
                resolve(data);
                return;
            };
        });
    });
}