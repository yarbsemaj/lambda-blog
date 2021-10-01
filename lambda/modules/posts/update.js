const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.default = (id, value, shouldUpdateCreatedAt = false) => {
    value.id = id;

    var params = {
        TableName: process.env.POST_TABLE,
        Key: { id },
        UpdateExpression: "set #status = :status, title = :title, body = :body, image = :image, description = :description",
        ExpressionAttributeValues: {
            ":status": value.status,
            ":title": value.title,
            ":body": value.body,
            ":image": value.image,
            ":description": value.description
        },
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ReturnValues: "ALL_NEW"
    };

    if (shouldUpdateCreatedAt) {
        params.UpdateExpression += ', createdDate = :createdDate';
        let date = new Date();
        params.ExpressionAttributeValues[':createdDate'] = date.toISOString();
    }

    return new Promise((resolve, rejects) => {
        DynamoDB.update(params, function (err, data) {
            console.log(err);
            if (err) rejects(err);
            console.log(data);
            resolve(value);
        });
    });
}