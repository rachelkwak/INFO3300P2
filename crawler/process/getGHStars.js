var fs = require('fs');

var moment = require('moment');
var _ = require('lodash');
var async = require('async');

var stargazer = require('./stargazer');
var ghReq = require('./util/req');

var allGH = require('./allGH');

var getItemArrHNStars = (items, itemArrHandler) => {
  async.mapSeries(items, (item, cb) => {
    console.log('Start with', item.ghName);

    async.parallel([
      (cb) => {
        stargazer(item.ghName, ghStars => {
          console.log('Done with', item.ghName);
          console.log('Star Num', ghStars.length);
          cb(null, {
            ghStars,
            ghName: item.ghName
          });
        });
      },
      (cb) => {
        var options = {
          url: '/repos/' + item.ghName
        };
        ghReq(options, (err, res, body) => {
          var data = JSON.parse(body);
          cb(null, {
            ghDesc: data.description,
            currStar: data.stargazers_count
          });
        });
      }
    ], (err, results) => {
      cb(null, _.assign(results[0], results[1]));
    });

  }, (err, results) => {
    itemArrHandler(results);
  });
};

getItemArrHNStars(allGH, data => {
  fs.writeFile('ghStars.json', JSON.stringify(data, null, 2), (err) => {
    console.log('All done!');
  });
});
