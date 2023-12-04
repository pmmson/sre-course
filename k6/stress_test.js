/*
 * Stress test
 *
 * K6_PROMETHEUS_RW_SERVER_URL="http://10.10.10.2:9090/api/v1/write" K6_PROMETHEUS_RW_TREND_STATS="min,avg,med,p(75),p(90),p(95),p(99),max" k6 run -o experimental-prometheus-rw stress_test.js
*/

import http from 'k6/http';

const params = {
  headers: {
    'host': 'sre-course-api.weather-api'
  }
}
const host = 'http://x.x.x.x'

export const options = {
  //thresholds: {
  //http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '10s' }], // http errors should be less than 1%
  // http_req_duration: [{threshold: 'p(95)<800', abortOnFail: true, delayAbortEval: '10s'}], // 95% of requests should be below 800ms
  //},
  stages: [
    { duration: '5s', target: 1 },
    { duration: '1m', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '5s', target: 300 },
    { duration: '1m', target: 10 },
    { duration: '5s', target: 300 },
    { duration: '2m', target: 10 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  http.get(host + '/cities', params);
  http.get(host + '/cities/' + getRandomNumber(1734, 2851), params);
  http.get(host + '/forecast', params);
  http.get(host + '/forecast/' + getRandomNumber(7134, 8252), params);
};

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
};
