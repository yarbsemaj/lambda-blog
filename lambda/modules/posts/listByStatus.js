const AWS = require("aws-sdk")
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.default = (status = 'published') => {
    var params = {
        TableName: process.env.POST_TABLE,
        IndexName: 'status-createdDate-index',
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
        KeyConditionExpression: '#status = :status',
        ScanIndexForward: false,
    };

    return new Promise((resolve, rejects) => {
        DynamoDB.query(params, function (err, data) {
            console.log(err)
            if (err) rejects(err)
            console.log(data)
            resolve(data.Items)
        });
    });
}