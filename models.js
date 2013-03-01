exports.configure = function(db) {
  var UserSchema = new db.Schema({
    "email": String,
    "googleAccessToken": String,
    "done": {
      "type": Boolean,
      "default": false
    }
  });
  exports.User = db.model('User', UserSchema);

  var LocationSchema = new db.Schema({
    "kind": String,
    "email": String,
    "timestampMs": String,
    "longitude": String,
    "latitude": String
  });
  exports.Location = db.model('Location', LocationSchema);
}
