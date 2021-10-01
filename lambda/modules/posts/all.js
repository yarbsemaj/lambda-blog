const AWS = require("aws-sdk")
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.default = () => {
    var params = {
        TableName: process.env.POST_TABLE,
    };

    return new Promise((resolve, rejects) => {
        DynamoDB.scan(params, function (err, data) {
            if (err) rejects(err)
            console.log(data)
            resolve(data.Items)
        });
    });
}