// node ./dataload.js   

/*

 curl -X 'POST' \
  'http://x.x.x.x/Cities' \
  -H 'accept: text/plain' \
  -H 'Content-Type: application/json' \
  -d '{
  "id": 0,
  "name": "TEST"
}'

*/

const lineReader = require('line-reader');
const request = require('request');
const sleep = require('sleep-promise');

// add all cities of Russia
/*
lineReader.eachLine('towns.jsonl', function (line) {
    request({
        headers: { 'HOST': 'sre-course-api.weather-api' },
        uri: 'http://x.x.x.x/Cities',
        json: { id: 0, name: JSON.parse(line).city },
        method: 'POST'
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
        console.log(body);
    });
    sleep(50);
});
*/

// add 5 forecast for each cities
/*

curl -X 'POST' \
  'http://x.x.x.x/Forecast/1735' \
  -H 'accept: text/plain' \
  -H 'Content-Type: application/json' \
  -d '{
  "id": 0,
  "cityId": 1735,
  "dateTime": 1696964803,
  "temperature": 25,
  "summary": "ясно"
}'

*/
var summaries = ["ясно", "пасмурно", "дождь", "снег", "гроза", "облачно", "штиль", "ураган", "туман", "ветер"]
// console.log(summaries[getRandomNumber(0, summaries.length)])
// console.log(Math.floor(new Date().getTime() / 1000))
// console.log(getRandomNumber(-30, 40))

request({
    headers: { 'HOST': 'sre-course-api.weather-api' },
    uri: 'http://x.x.x.x/Cities',
    method: 'GET'
}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(response.statusCode);
        cities = JSON.parse(body);
        var i;
        for (i = 0; i < cities.length; ++i) {
            //console.log(cities[i].id);
            request({
                headers: { 'HOST': 'sre-course-api.weather-api' },
                uri: 'http://x.x.x.x/Forecast/' + cities[i].id,
                json: {
                    id: 0,
                    cityId: cities[i].id,
                    dateTime: Math.floor(new Date().getTime() / 1000),
                    temperature: getRandomNumber(-30, 40),
                    summary: summaries[getRandomNumber(0, summaries.length)]
                },
                method: 'POST'
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                }
                console.log(body);
            })
        }
    }
});

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
};

