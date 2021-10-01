const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.default = (id) => {

    var params = {
        TableName: process.env.POST_TABLE,
        Key: { id }
    };

    return new Promise((resolve, rejects) => {
        DynamoDB.get(params, function (err, data) {
            console.log(err);
            if (err) rejects(err);
            resolve(data.Item);
        });
    });
}