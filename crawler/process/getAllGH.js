var fs = require('fs');
var url = require('url');

var _ = require('lodash');
var async = require('async');

fs.readdir('data', (err, files) => {
  var ghItems = {};

  async.each(files, (f, cb) => {
    var fullPath = 'data/' + f;

    fs.readFile(fullPath, 'utf8', (err, data) => {
      var top100 = JSON.parse(data);

      _.each(top100, (item, i) => {
        if (item.url) {
          var urlObj = url.parse(item.url);
          if (urlObj.hostname == 'github.com' &&
              !_.startsWith(urlObj.pathname, '/blog') &&
              urlObj.pathname.split('/').length == 3) {
            ghItems[item.id] = item;
          }
        }
      });

      cb();
    });

  }, err => {
    var processedItems = _.map(ghItems, item => {
      return {
        id: item.id,
        ghName: url.parse(item.url).pathname.slice(1),
        ghUrl: item.url,
        hnTitle: item.title,
        hnLink: item.url
      };
    });

    fs.writeFile('allGH.json', JSON.stringify(data, null, 2), (err) => {
      console.log('All done!');
    });
  });
});
