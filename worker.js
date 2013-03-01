var db = null;
var models = require('./models');

exports.configure = function(dbParam) {
  db = dbParam;
}
exports.worker = function() {
  setInterval(function() {
    models.User.find({"done": false}).exec(function(err, users) {
      if (err) { return; }
      if (!users) { return; }
      for (var user = 0; user < users.length; user++) {
        getKML(users[user].accessToken, function(locations) {
          for (var location = 0; location < locations.length; location++) {
            locations[location] = {
              "userId": users[user].id,
              "timestampMs": locations[location].timestampMs,
              "longitude": locations[location].longitude,
              "latitude": locations[location].latitude
            }
          }
          models.Location.insert(locations);
          // @TODO stopped here
        }); 
      }
    });
  }, 1000);
}

// Time goes from now to past the higher the index of locations
function getKML(accessToken, done, maxTime, locations) {
  console.log('in getKML');
  if (!locations) { locations = []; }
  
  // @TODO remove this temporary stop condition
//  if (locations.length > 20000) { return done(locations); }

  if (!maxTime) { maxTime = new Date().getTime(); }
  console.log('maxTime = ' + maxTime);
  restler.get('https://www.googleapis.com/latitude/v1/location?max-results=1000&max-time=' + maxTime + '&access_token=' + accessToken).on('success', function(data, gRes) {
    console.log('req to Latitude complete');
    console.log('data.data.items.length = ' + data.data.items.length);
    if (data.data && data.data.items) {
      console.log('end = ' + JSON.stringify(data.data.items[data.data.items.length -1]));
      newMaxTime = data.data.items[data.data.items.length - 1].timestampMs;
      locations = locations.concat(data.data.items);
      console.log('locations.length = ' + locations.length);
      if (maxTime == newMaxTime) {
        console.log('maxTime == newMaxTime');
        return done(locations);
      }
      getKML(accessToken, done, newMaxTime, locations);
    } else {
      console.log('done with recursion');
      return done(locations);
    }
  });
}
