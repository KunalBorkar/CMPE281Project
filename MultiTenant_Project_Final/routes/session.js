var UsersDAO = require('../users').UsersDAO
  , SessionsDAO = require('../sessions').SessionsDAO;

/* The SessionHandler must be constructed with a connected db */
function SessionHandler (db) {
    "use strict";

    var users = new UsersDAO(db);
    var sessions = new SessionsDAO(db);

    this.isLoggedInMiddleware = function(req, res, next) {
       var session_id = req.cookies.session;
        //console.log(session_id);
       sessions.getUsername(session_id, function(err, userInfo) {
           "use strict";
            //console.log(req.uer)
           if (!err && userInfo.username) {
               req.username = userInfo.username;
               //console.log(JSON.stringify(req.username));
           }
           return next();
       });
   }

}
module.exports = SessionHandler;