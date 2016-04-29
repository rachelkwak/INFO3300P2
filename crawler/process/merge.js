var fs = require('fs');

var _ = require('lodash');

var allGH = require('./allGH');

var ghStars = require('./ghStars');
var hnRanks = require('./hnRanks');

var data = _.map(allGH, (item, i) => {
  return _.assign(item, hnRanks[i], ghStars[i]);
});

_.each(data, (item) => {
  item.started = item.hnRanks[0].time;
  item.end = _.last(item.hnRanks).time;

  var start = new Date(item.started);
  var end = new Date(item.end);

  var fullLength = item.ghStars.length;
  var endIndex = _.findLastIndex(item.ghStars, (star) => {
    return new Date(star.time) < end;
  });

  item.ghStars = _.filter(item.ghStars, (star) => {
    var curr = new Date(star.time);
    return curr > start && curr < end;
  });

  var starsIncreased = item.ghStars.length;

  console.log(item.ghName);
  console.log(item.currStar);
  console.log(endIndex);
  console.log(fullLength);
  item.endStar = item.currStar - (fullLength - endIndex);
  item.startStar = item.endStar - starsIncreased;
});

fs.writeFile('data.json', JSON.stringify({ data }, null, 2), (err) => {
  console.log('All done!');
});
