const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    getCityData().then(dbResults => {
        const cities = dbResults.Item.cities;
        callback(null, {
            statusCode: 201,
            body: JSON.stringify(cities),
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    }).catch(err => {
        console.log(`Problem collecting the City data!`);
        console.error(err);
        errorResponse(err.message, context.awsRequestId, callback);
    });  //calls the actual method for the post

}


function getCityData(callback) {
    return ddb.get({
        TableName: 'distance_data',
        Key: { region: 'Minnesota' },
        ProjectionExpression: "cities"
    }).promise()
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