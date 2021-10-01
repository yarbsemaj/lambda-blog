

// A simple token-based authorizer example to demonstrate how to use an authorization token 
// to allow or deny a request. In this example, the caller named 'user' is allowed to invoke 
// a request if the client-supplied token value is 'allow'. The caller is not allowed to invoke 
// the request if the token value is 'deny'. If the token value is 'unauthorized' or an empty
// string, the authorizer function returns an HTTP 401 status code. For any other token value, 
// the authorizer returns an HTTP 500 status code. 
// Note that token values are case-sensitive.

exports.handler = async function (event, context, callback) {
    var token = event.authorizationToken
    console.log(event)
    if (!token) {
        callback("Error: Invalid token");
    }
    token = token.replace("Basic ", "")
    console.log(token)
    console.log(process.env.USER)
    try {
        if (token === process.env.USER) {
            callback(null, generatePolicy('user', 'Allow', event.methodArn));
        }
    } catch (e) {
        callback("Unauthorized");
    }
    callback("Unauthorized");
};

// Help function to generate an IAM policy
var generatePolicy = function (principalId, effect, resource) {
    var authResponse = {};

    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = "*";
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = {};
    return authResponse;
}