const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    const pathParameters = event.pathParameters;
    const givenRouteId = pathParameters.routeId;


    getRouteById(givenRouteId)
        .then(dbResults => {
            const routeFromId = dbResults.Item;
            callback(null, {
                statusCode: 201,
                body: JSON.stringify(routeFromId), //returns found route by id
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });
        })
        .catch(err => {
            console.log(`Problem getting certain route with id: ${givenRouteId}`);
            console.error(err);
            errorResponse(err.message, context.awsRequestId, callback);
        });
}

function getRouteById(givenRouteId) {
    return ddb.get({
        TableName: 'routes',
        Key: {
            "routeId": givenRouteId
        },
    }).promise();
}

function errorResponse(errorMessage, awsRequestId, callback) {
    callback(null, {
        statusCode: 500,
        body: JSON.stringify({
            Error: errorMessage,
            Reference: awsRequestId,
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
}