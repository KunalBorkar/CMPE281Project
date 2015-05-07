var express = require('express')
  , app = express() // Web framework to handle routing requests
  , MongoClient = require('mongodb').MongoClient // Driver for connecting to MongoDB
  , routes = require('./routes'); // Routes for our application

  //CSS & jQuery path setup
  var path = require('path');

  //Favicon
  var favicon = require('serve-favicon');
  
MongoClient.connect('mongodb://localhost:27017/multiTenancy', function(err, db) {
    "use strict";
    if(err) throw err;

    // Register our templating engine
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
	
	//Favicon
	//app.use(favicon(__dirname + 'views/img/favicon.png'));

    app.use(express.favicon(path.join(__dirname, 'public','images','favicon.ico')));

    // Express middleware to populate 'req.cookies' so we can access cookies
    app.use(express.cookieParser());

    // Express middleware to populate 'req.body' so we can access POST variables
    app.use(express.bodyParser());
	
	//CSS & jQuery path setup
	app.use(express.static(path.join(__dirname, 'views')));

    // Application routes
    routes(app, db);

    app.listen(5000);

    console.log('Express server listening on port 5000');
});