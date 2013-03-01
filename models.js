exports.configure = function(db) {
  var UserSchema = new db.Schema({
    "name": String,
    "googleAccessToken": String,
    "done": {
      "type": Boolean,
      "default": false
    }
  });
  exports.User = db.model('User', UserSchema);

  var LocationSchema = new db.Schema({
    "userId": String,
    "timestampMs": String,
    "longitude": String,
    "latitude": String
  });
  exports.Location = new db.model('Location', LocationSchema);
}
