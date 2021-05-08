const randomBytes = require('crypto').randomBytes;

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const runId = requestBody.runId;
    const generation = requestBody.generation;
    console.log(runId+ " run id");
    console.log(generation+" generation");
    const partitionKey = runId + '#' + generation;
    console.log(partitionKey);

    generateRandomRoute(runId, generation, callback, partitionKey);  //calls the actual method for the post

}

function generateRandomRoute(runId, generation, callback, partitionKey) {
    getData().then(routeData =>{

        const routeObjectData = JSON.stringify(routeData.Item.cities);
        const cityDistances = routeData.Item.distances;

        const cityArray = new Array();
        //gets the number of cities in the db. Sourced from this stackoverflow discussion https://stackoverflow.com/questions/13782698/get-total-number-of-items-on-json-object
        const numOfCities = Object.keys(routeData.Item.cities).length;
        console.log("There are " + numOfCities + " cities in this route");
        fillCityArray(cityArray, numOfCities); // fills the array with the index of cities
        shuffleCities(cityArray); // shuffles the city array


        const routeId = toUrlString(randomBytes(16));
        const routeDistance = calculateRouteDistance(cityArray, cityDistances);

        return ddb.put(
            {TableName: 'routes',
                Item: {
                    runGen: partitionKey,
                    routeId: routeId,
                    route: cityArray,
                    len: routeDistance,
                    // runId: runId,
                    // generation: generation
                },

            }).promise().then(dbResults => {
            callback(null, {
                statusCode: 201,
                body: JSON.stringify({
                    routeId: routeId,
                    len: routeDistance,
                }),
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });
        });

    });
}

function getData() {
    return ddb.get({
        TableName: 'distance_data',
        Key: { region: 'Minnesota' }
    }).promise();
}

//Shuffle example comes from https://javascript.info/task/shuffle
function shuffleCities(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

        // swap elements array[i] and array[j]
        // we use "destructuring assignment" syntax to achieve that
        // you'll find more details about that syntax in later chapters
        // same can be written as:
        // let t = array[i]; array[i] = array[j]; array[j] = t
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function fillCityArray(array, numOfCities) {
    for (let i = 0; i < numOfCities; i++){
        array[i] = i;
    }
}

function calculateRouteDistance(array, distances){
    let totalDistance = 0;
    for (let i = 0; i < array.length; i++){
        if (i == array.length-1){
            const finalStop = array[i];
            const startCity = array[0];
            const firstLastDistance = distances[finalStop][startCity];
            totalDistance = totalDistance + firstLastDistance;
        } else {
            const cityA = array[i];
            const cityB = array[i+1];
            const abDistance = distances[cityA][cityB];
            totalDistance = totalDistance + abDistance;
        }
    } return totalDistance;
}

function randomRoute (runId, generation, routeId, route, length) {
    return ddb.put({
        TableName: 'routes',
        Item: {
            //runId: 'runId',
            //generation: generation,
            partitionKey: runId + '#' + generation,
            routeId: routeId,
            route: route,
            sortKey: length
        },
    }).promise();
}

//From the "requestUnicorn" lambda function from the WildRydes demo created by Amazon
function toUrlString(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

//From the "requestUnicorn" lambda function from the WildRydes demo created by Amazon
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