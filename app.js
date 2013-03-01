  //<when><%= new Date(locations[i].timestampMs).toISOString().replace(/T/, ' ').replace(/\..+/, '') %></when>
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./config.json');
var google = require('./google.json');
var http = require('http');
var express = require('express');
var restler = require('restler');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var mongoose = require('mongoose');
var models = require('./models');
var worker = require('./worker');

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
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('port', process.env.PORT || 3000);
});

mongoose.connect(config.mongo.uri);
models.configure(mongoose);
worker.configure(mongoose);

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy({
  clientID: google.appId,
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
  // present the user with a hash or something
  // or email the user
  getKML(req.user.accessToken, function(locations) {
    console.log('in /getKML callback');
    /*
    console.log('getKML done function locations.length = ' + locations.length);
    var outString = "";
    for (var i = 0; i < locations.length; i++) {
      outString += 'locations[' + i + ']  ' + JSON.stringify(locations[i]) + '\n';
    }
    return res.send(outString);
    */
    //return res.render('kml', {"locations": locations});
    fs.readFile('./views/kml.ejs', 'utf-8', function(err, data) {
        console.log('reading kml template err ' + err);
        if(!err) {
            templateString = data;
        }
        var outputString = ejs.render(templateString, {"locations": locations});
        var rightNow = new Date().getTime();
        fs.writeFile('./public/' + rightNow + '.kml', outputString, function(err) {
          console.log('writing kml file');
          if (!err) {
            return res.send(rightNow + '.kml');
          }
        });
    });
  });
});

server = http.createServer(app);
server.listen(app.get('port'));
console.log('listening...');
