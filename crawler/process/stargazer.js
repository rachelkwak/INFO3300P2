var req = require('./util/req.js');
var parseLink = require('./util/parseLink.js');

var qs = require('query-string'),
    _ = require('lodash'),
    async = require('async');

// Get a list of star subscriptions of this format:
// [{ user: 'dragon3', time: '2015-08-27T15:47:52Z' },
//  { user: 'mcmo'   , time: '2015-08-27T22:57:45Z' } ]
// The list is ranked by time from oldest to newest
module.exports = function stargazer(repoURL, cb) {
  var stars = [];

  function addStars(body) {
    _.forEach(JSON.parse(body), function(star) {
      stars.push({
        user: star.user.login,
        time: star.starred_at
      });
    });
  }

  var options = {
    url: '/repos/' + repoURL + '/stargazers',
    headers: { 'Accept': 'application/vnd.github.v3.star+json' },
    qs: { 'per_page': 100 }
  };

  req(options, function(err, res, body) {
    // Multiple pages
    if (res.headers.link) {
      var links = parseLink(res.headers.link);
      var lastPage = parseInt(qs.parse(links.last).page, 10);
      var pages = _.range(1, lastPage + 1);

      var iterator = function(page, done) {
        var options = {
          url: '/repos/' + repoURL + '/stargazers',
          headers: { 'Accept': 'application/vnd.github.v3.star+json' },
          qs: { 'per_page': 100, page: page }
        };

        req(options, function(err, res, body) {
          addStars(body);
          done();
        });
      };

      async.eachLimit(pages, 3, iterator, function(err) {
        var sorted = _.sortBy(stars, function(star) {
          return star.time;
        });

        if (cb) cb(sorted);
      });
    }
    // Single page
    else {
      addStars(body);

      var sorted = _.sortBy(stars, function(star) {
        return star.time;
      });

      if (cb) cb(sorted);
    }
  });
};
