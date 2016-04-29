var fs = require('fs');

var async = require('async');
var _ = require('lodash');

var allGH = require('./allGH');

var getItemArrHNRanks = (items, itemArrHandler) => {
  async.mapLimit(items, 5, (item, cb) => {
    getSingleItemHNRanks(item, (hnRanks) => {
      console.log('Done with item ', item.id);
      cb(null, {
        hnRanks
      });
    });
  }, (err, results) => {
    itemArrHandler(results);
  });
};

var getSingleItemHNRanks = (item, singleItemHandler) => {
  var hnRanks = [];

  fs.readdir('data', (err, files) => {
    async.each(files, (f, cb) => {
      var fullPath = 'data/' + f;

      fs.readFile(fullPath, 'utf8', (err, data) => {
        if (err) console.log(err);
        var top100 = JSON.parse(data);

        var rank = _.findIndex(top100, { id: item.id }) + 1;
        if (rank) {
          var score = top100[rank - 1].score;

          hnRanks.push({
            time: _.trimEnd(f, '.json'),
            rank: rank,
            score: score
          });
        }

        cb();
      });
    }, (err) => {
      singleItemHandler(_.sortBy(hnRanks, 'time'));
    });
  });
};

getItemArrHNRanks(allGH, output => {
  fs.writeFile('hnRanks.json', JSON.stringify(output, null, 2), err => {
    console.log('All done');
  });
});
