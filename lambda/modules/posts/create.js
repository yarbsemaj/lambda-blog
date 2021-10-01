const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.default = (value) => {
    let date = new Date();
    value.id = generateID(value.title);
    value.createdDate = date.toISOString();

    var params = {
        TableName: process.env.POST_TABLE,
        Item: value
    };

    return new Promise((resolve, rejects) => {
        DynamoDB.put(params, function (err, data) {
            console.log(err);
            if (err) rejects(err);
            console.log(data);
            resolve(value);
        });
    });
}

function generateID(title) {
    return title
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .join('-')
        .toLowerCase();
}