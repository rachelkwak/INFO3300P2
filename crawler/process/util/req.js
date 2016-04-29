var request = require('request');

var token = require('./token');

module.exports = request.defaults({
  headers: {
    'Authorization': token,
    'User-Agent': 'octref',
    'Accept': 'application/vnd.github.v3+json'
  },
  baseUrl: 'https://api.github.com/'
});
