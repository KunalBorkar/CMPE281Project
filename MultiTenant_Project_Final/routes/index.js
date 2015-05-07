var SessionHandler = require('./session')
    , ContentHandler = require('./content')
    , ErrorHandler = require('./error').errorHandler;

module.exports = exports = function (app, db) {

    var sessionHandler = new SessionHandler(db);
    var contentHandler = new ContentHandler(db);

    // Middleware to see if a user is logged in
    app.use(sessionHandler.isLoggedInMiddleware);

    // The main page of the blog
    app.get('/', contentHandler.displayIndexPage);
    app.get('/waterfallDashboard', contentHandler.displayWaterfallDashboard);
    app.get('/scrumDashboard', contentHandler.displayScrumDashboard);
    app.get('/kanbanDashboard', contentHandler.displayKanbanDashboard);
    app.get('/editActivity/:cardID', contentHandler.displayEditActivity);
    app.get('/editScrumActivity/:sprintID/:taskID', contentHandler.displayEditScrumActivity);
    app.get('/signup', contentHandler.displaySignUpPage);
    app.get('/signin', contentHandler.displaySignInPage);
    app.get('/displayNewScrumTaskForm/:sprintID', contentHandler.displayNewScrumTaskForm);
    app.get('/projectStatus', contentHandler.displayProjectStatusPage);
    app.get('/addNewKabanCard', contentHandler.displayAddTask);
    app.get('/logout', contentHandler.logout);
    app.get('/editWaterfallActivity/:taskId', contentHandler.waterfallDisplayEditActivity);
    app.get('/deleteWaterfallTask/:taskId', contentHandler.waterfallDeleteTask);
    app.get('/addWaterfallTask', contentHandler.addWaterfallTask);

    app.post('/signIn', contentHandler.displayDashboard);
    app.post('/signUp', contentHandler.addNewUser);
    //app.post('/logout', contentHandler.logout);
    //app.post('/editActivity/:taskID', contentHandler.updateTask);
    app.post('/updateTask/:cardID', contentHandler.updateTask);
    app.post('/signup', contentHandler.displaySignUpPage);
    app.get('/deleteTask/:cardID', contentHandler.deleteTask);
    app.post('/addKanbanCard', contentHandler.createNewTask);
    app.post('/addNewScrumTask', contentHandler.addNewScrumTask);
    app.get('/deleteScrumTask/:taskID', contentHandler.deleteScrumTask);
    app.post('/editWaterfallActivity/:taskId', contentHandler.waterfallUpdateTask);
    app.post('/addWaterfallTask', contentHandler.createWaterfallTask);

    app.use(ErrorHandler);
}
