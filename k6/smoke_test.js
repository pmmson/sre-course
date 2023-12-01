/*
 Smoke test
 K6_PROMETHEUS_RW_SERVER_URL=http://x.x.x.x:9090/api/v1/write K6_PROMETHEUS_RW_TREND_STATS=min,avg,med,p(75),p(90),p(95),p(99),max k6 run -o experimental-prometheus-rw smoke_test.js
*/

import http from 'k6/http';

const params = {
  headers: {
    'host': 'sre-course-api.weather-api',
    'Content-Type': 'application/json'
  }
}

const summaries = ["ясно", "пасмурно", "дождь", "снег", "гроза", "облачно", "штиль", "ураган", "туман", "ветер"]

export const options = {
  vus: 3,
  duration: '1m',
};

export default function () {
  let citiesBody = http.get('http://x.x.x.x/cities', params);
  let cities = JSON.parse(citiesBody.body)
  //  console.log(cities[1].id);
  //  console.log(cities[cities.length-1].id);
  let city = getRandomNumber(cities[1].id, cities[cities.length - 1].id + 1);
  let body = {
    id: 0,
    cityId: city,
    dateTime: Math.floor(new Date().getTime() / 1000),
    temperature: getRandomNumber(-30, 40),
    summary: summaries[getRandomNumber(0, summaries.length)]
  }
  http.get('http://x.x.x.x/cities/' + city, params);
  let forecastBody = http.get('http://x.x.x.x/forecast', params);
  let forecasts = JSON.parse(forecastBody.body)
  http.get('http://x.x.x.x/forecast/' + getRandomNumber(forecasts[1].id, forecasts[forecasts.length - 1].id + 1), params);
  http.get('http://x.x.x.x/forecast', params);
  http.post('http://x.x.x.x/forecast/' + city, JSON.stringify(body), params);
  http.get('http://x.x.x.x/weatherforecast', params);
};


function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
};

