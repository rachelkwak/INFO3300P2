module.exports = function(link) {
  var tokens = link.split(',');
  var result = {};

  tokens.forEach(function(token) {
    var arr = token.split(';');
    var url = arr[0].trim().slice(1, -1);
    var rel = arr[1].trim().split('=')[1].trim().replace(/"/g, '');
    result[rel] = url;
  });

  return result;
}
