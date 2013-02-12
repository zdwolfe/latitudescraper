var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./config.json');
var google = require('./google.json');
var http = require('http');
var express = require('express');
var restler = require('restler');

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard catasdlm' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.set('port', process.env.PORT || 3000);
});

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy({
  clientID: config.google.appId,
  clientSecret: google.appSecret,
  callbackURL: google.callbackURI
  }, function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
}));

app.get('/auth/logout', function(req, res) { 
  req.logout(); 
  return res.send(null, 200);
});

app.get('/auth/google/callback', 
   passport.authenticate('google', { failureRedirect: '/googleFail' }),
   function(req, res) {
      return res.redirect('/getKML');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: 
    ['https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/latitude.all.best'] }
));

app.get('/', function(req, res) {
  console.log('/');
  return res.send('this is /');
});

app.get('/getKML', function(req, res) {
  getKML(req.user.accessToken, function(locations) {
    console.log('getKML done function locations.length = ' + locations.length);
    var outString = "";
    for (var i = 0; i < locations.length; i++) {
      outString += 'locations[' + i + '].timestampMs = ' + locations[i].timestampMs + '\n';
    }
    return res.send(outString);
  });
});

// Time goes from now to past the higher the index of locations
function getKML(accessToken, done, maxTime, locations) {
  console.log('in getKML');
  if (!locations) { locations = []; }
  if (!maxTime) { maxTime = new Date().getTime(); }
  console.log('maxTime = ' + maxTime);
  restler.get('https://www.googleapis.com/latitude/v1/location?max-results=1000&max-time=' + maxTime + '&access_token=' + accessToken).on('success', function(data, gRes) {
    console.log('req to Latitude complete');
    console.log('data.data.items.length = ' + data.data.items.length);
    if (data.data && data.data.items) {
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

server = http.createServer(app);
server.listen(app.get('port'));
