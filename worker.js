var restler = require('restler');
var models = require('./models');
var worker = exports;

exports.query = function() {
  console.log('enter worker.query');
  models.User.find({"done": false}).limit(20).exec(function(err, users) {
    console.log('worker.query found ' + users.length + ' users');
    if (err) { return; }
    if (!users) { return; }
    for (var user = 0; user < users.length; user++) {
      console.log('worker.query calling getKML for user');
      worker.getKML(users[user].googleAccessToken, function(locations) {
        console.log('worker.query getKML callback');
        console.log('worker.query locations.length = ' + locations.length);
        for (var location = 0; location < locations.length; location++) {
          locations[location].email = users[user].email;
        }
        console.log('about to insert locations');
        console.log('locations.length = ' + locations.length);
        models.Location.insert(locations, function(err) {
          console.log('in update callback');
          console.log('err = ' + JSON.stringify(err));
          if (user == users.length) { return; }
        });
      }); 
    }
  });
}

// Time goes from now to past the higher the index of locations
exports.getKML = function(accessToken, done, maxTime, locations) {
  if (!locations) { 
    console.log('resetting locations');
    locations = []; 
  }
  console.log('getKML locations.length = ' + locations.length);
  
  if (locations.length >= 1000) { 
    console.log('length is greater than 1000');
    return done(locations); 
  }

  if (!maxTime) { maxTime = new Date().getTime(); }
  
  console.log('maxTime = ' + maxTime);
  restler.get('https://www.googleapis.com/latitude/v1/location?max-results=1000&max-time=' + maxTime + '&access_token=' + accessToken).on('success', function(data, gRes) {
    console.log('in GL request callback');
    if (data.data && data.data.items) {
      newMaxTime = data.data.items[data.data.items.length - 1].timestampMs;
      locations = locations.concat(data.data.items);
      if (maxTime == newMaxTime) {
        console.log('maxTime == newMaxTime');
        return done(locations);
      }
      console.log('about to recurse');
      worker.getKML(accessToken, done, newMaxTime, locations);
    } else {
      console.log('worker.getKML ***done*** with recursion');
      models.User.findOne({googleAccessToken: accessToken}).exec(function(err, user) {
        user.done = true;
        user.save(function(err) {
          if (err) { console.log('error saving db = ' + JSON.stringify(err)); }
          return done(locations);
        });
      });
    }
  });
}
