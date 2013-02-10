var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./config.json');
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
  clientSecret: config.google.appSecret,
  callbackURL: config.google.callbackURI
  }, function(accessToken, refreshToken, profile, done) {
    console.log('accessToken = ' + accessToken);
    console.log('refreshToken = ' + refreshToken);
    console.log('profile = ' + JSON.stringify(profile));
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
  console.log('session accessToken = ' + req.session.accessToken);

  return res.json(req.user);
});

server = http.createServer(app);
server.listen(app.get('port'));
