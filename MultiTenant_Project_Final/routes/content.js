var UsersDAO = require('../users').UsersDAO;
var SessionsDAO = require('../sessions').SessionsDAO;
var contentObj = require('../routes/content');

/* The ContentHandler must be constructed with a connected db */
function ContentHandler(db) {
    "use strict";
    var users = new UsersDAO(db);
    var sessions = new SessionsDAO(db);

    this.displayIndexPage = function (req, res, next) {
        "use strict";

        return res.render("index");
    }

    this.displayDashboard = function (req, res, next) {
        "use strict";

        var userName = req.body.userName;
        var password = req.body.password;
        exports.userNameSession = userName;
        users.validateLogin(userName, password, function (err, userDoc) {
            if (err) {
                console.log("Invalid User");
            }
            else {
                sessions.startSession(userDoc['_id'], function (err, session_id) {
                    if (err) return next(err);
                    res.cookie('session', session_id);
                    var softDevelopmentMethodology = userDoc['SoftwareDevelopmentMethod'];
                    exports.currentSLDC = softDevelopmentMethodology;
                    console.log("Software Methodology..." + softDevelopmentMethodology);
                    users.getTasks(userName, softDevelopmentMethodology, function (err, userTasks) {
                        console.log("tasks collection..." + userTasks);
                        var currentUserTasks = [], currentUserTasksNew = [], j = 0, count = 0;


                        if (softDevelopmentMethodology == "Waterfall") {
                            currentUserTasks = userTasks;
                            currentUserTasks.forEach(function (task) {
                                if (task.taskStatus == "In Progress") {
                                    currentUserTasksNew.push(task);
                                }
                                count++;
                                if (count == currentUserTasks.length) {
                                    return res.render('waterfallDashboard', {'userCurrentTasks': currentUserTasksNew});
                                }
                            });

                        }
                        else {
                            if (softDevelopmentMethodology == "Scrum") {
                                console.log("inside scrum..." + userTasks.task.length);

                                for (var i = 0; i < userTasks.task.length; i++) {
                                    currentUserTasks[j] = userTasks.task[i];
                                    console.log("Scrum " + currentUserTasks[j].owner);
                                    j++;
                                }
                                return res.render('ScrumMain', {
                                    'userCurrentTasks': currentUserTasks,
                                    'projectDetails': userTasks
                                });
                            }
                            else {
                                if (userTasks.card.length > 0) {
                                    for (var i = 0; i < userTasks.card.length; i++) {
                                        if (userTasks.card[i].status == "In Progress") {
                                            currentUserTasks[j] = userTasks.card[i];
                                            j++;
                                        }
                                    }
                                    return res.render('kanbanDashboard', {'userCurrentTasks': currentUserTasks});
                                }
                                else {
                                    return res.render('kanbanDashboard', {'userCurrentTasks': "New User"});
                                }

                            }
                        }
                    });
                });
            }
        });
    }

    this.addNewUser = function (req, res, next) {
        "use strict";

        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var userName = req.body.userName;
        var password = req.body.password;
        var softDevelopmentMethod = req.body.softDevelopmentMethod;

        users.registerUser(firstName, lastName, userName, password, softDevelopmentMethod, function (err, writeResult) {
            "use strict";

            sessions.startSession(userName, function (err, session_id) {
                "use strict";

                if (err) return next(err);
                res.cookie('session', session_id);
                var softDevelopmentMethodology = softDevelopmentMethod;
                if (softDevelopmentMethodology == "Waterfall") {
                    return res.redirect('/waterfallDashboard');
                }
                else {
                    if (softDevelopmentMethodology == "Scrum") {
                        return res.redirect('/scrumDashboard');
                    }
                    else {
                        return res.redirect('/kanbanDashboard');
                    }
                }

            });
        });

        //return res.redirect('/');
    }

    this.logout = function (req, res, next) {
        "use strict";

        var session_id = req.cookies.session;
        sessions.endSession(session_id, function (err) {
            "use strict";
            // Even if the user wasn't logged in, redirect to home
            res.cookie('session', '');
            return res.redirect('/');
        });
    }

    this.displayWaterfallDashboard = function (req, res, next) {
        "use strict";
        res.render("waterfallDashboard", {"userCurrentTask": "NewUser"});

    }

    this.displayScrumDashboard = function (req, res, next) {
        "use strict";
        res.render("scrumDashboard", {'projectDetails': "New User"});
    }


    this.displayKanbanDashboard = function (req, res, next) {
        "use strict";
        console.log("in NEW displayKanbanDashboard");
        res.render("kanbanDashboard", {'userCurrentTasks': "New User"});
    }


    this.displayEditActivity = function (req, res, next) {
        "use strict";
        var cardID = req.params.cardID;
        var userName = contentObj.userNameSession;
        var tenantData = [], k = 0;

        users.getTenantFields(userName, function (err, tenantFields) {
            var currentSDLC = tenantFields.SoftwareDevelopmentMethod;
            users.getTasks(userName, currentSDLC, function (err, userTask) {

                for (var i = 0; i < userTask.card.length; i++) {
                    if (userTask.card[i].id == cardID) {
                        var jsonObject = userTask.card[i];
                        console.log("jsonObject:... " + jsonObject);
                        for (var prop in jsonObject) {
                            for (var j = 0; j < tenantFields.userTaskFields.length; j++) {
                                if (prop == tenantFields.userTaskFields[j]) {
                                    tenantData[k] = jsonObject[prop];
                                    k++;
                                }
                            }
                        }
                    }
                }
                res.render('editActivity', {'tenantFields': tenantFields, 'tenantData': tenantData});//console.log("TenantData"+tenantData);
            });
        });
    }

    this.displayProjectStatusPage = function (req, res, next) {
        "use strict";

        var userName = contentObj.userNameSession;
        // var softDevelopmentMethodology = req.body.softDevelopmentMethod;
        //

        users.getTenantFields(userName, function (err, tenantFields) {
                console.log("tenantFields...." + JSON.stringify(tenantFields));
                var currentSDLC = tenantFields.SoftwareDevelopmentMethod;
                users.getTasks(userName, currentSDLC, function (err, userTasks) {
                    var currentUserTasks = [], requestedUserTasks = [], completedUserTasks = [], j = 0;
                    var softDevelopmentMethodology = tenantFields.SoftwareDevelopmentMethod;
                    var userDefinedFields = tenantFields.userTaskFields;
                    exports.sessionTaskColumns = userDefinedFields;
                    console.log("im in projectStatus -> sessionTaskColumns .. " + contentObj.sessionTaskColumns);
                    console.log("Methodology...." + softDevelopmentMethodology);


                    if (softDevelopmentMethodology == "Waterfall") {
                        var tenantData = [], k = 0;
                        for (var i = 0; i < userTasks.length; i++) {
                            var jsonObject = userTasks[i];
                            console.log("jsonObject:... " + jsonObject);
                            for (var prop in jsonObject) {
                                for (var j = 0; j < tenantFields.userTaskFields.length; j++) {
                                    if (prop == tenantFields.userTaskFields[j]) {
                                        tenantData[k] = jsonObject[prop];
                                        k++;
                                    }
                                }
                            }
                        }
                        console.log("Waterfall data: " + tenantData);
                        console.log("Waterfall fields: " + JSON.stringify(tenantFields.userTaskFields));
                        console.log("user tasks array: " + JSON.stringify(userTasks));
                        res.render('projectStatusWaterfall', {
                            'tenantData': tenantData,
                            'tenantFields': tenantFields.userTaskFields,
                            'tenantDataLength': userTasks.length,
                            'tenantFieldsLength': tenantFields.userTaskFields.length,
                            'taskArrayList': userTasks
                        });
                    }


                    else {
                        if (softDevelopmentMethodology == "Scrum") {
                            console.log("userTasks...." + JSON.stringify(userTasks));
                            for (var i = 0; i < userTasks.task.length; i++) {

                                currentUserTasks[j] = userTasks.task[i];
                                j++;

                            }
                            j = 0;

                            //var columnValues = [];
                            //for (var i = 0; i < currentUserTasks.length; i++) {
                            //    for (var j = 0; j < userDefinedFields.length; j++) {
                            //        var prop = userDefinedFields[j];
                            //        var obj = currentUserTasks[i];
                            //        //console.log("...prop..." + prop);
                            //        //console.log("...obj..." + JSON.stringify(currentUserTasks[i]));
                            //        //console.log("...value..." + currentUserTasks[i] + "***" + obj[prop]);
                            //        columnValues.push(obj[prop]);
                            //    }
                            //
                            //}

                            var columnValues = [], k = 0;
                            for (var i = 0; i < currentUserTasks.length; i++) {
                                var jsonObject = currentUserTasks[i];
                                console.log(jsonObject);
                                for (var prop in jsonObject) {

                                    for (var j = 0; j < userDefinedFields.length; j++) {
                                        if (prop == userDefinedFields[j]) {
                                            columnValues[k] = jsonObject[prop];
                                            k++;
                                        }
                                    }

                                }
                            }


                            console.log("Column Values: ... " + JSON.stringify(columnValues));
                            return res.render('scrumDashboard', {
                                'userCurrentTasks': currentUserTasks,
                                'projectDetails': userTasks,
                                'userDefinedFields': userDefinedFields,
                                'columnValues': columnValues
                            });
                        }
                        else {
                            for (var i = 0; i < userTasks.card.length; i++) {
                                if (userTasks.card[i].status == "In Progress") {
                                    currentUserTasks[j] = userTasks.card[i];
                                    j++;
                                }
                            }
                            j = 0;
                            for (var i = 0; i < userTasks.card.length; i++) {
                                if (userTasks.card[i].status == "Requested") {
                                    requestedUserTasks[j] = userTasks.card[i];
                                    j++;
                                }
                            }
                            j = 0;
                            for (var i = 0; i < userTasks.card.length; i++) {
                                if (userTasks.card[i].status == "Complete") {
                                    completedUserTasks[j] = userTasks.card[i];
                                    j++;
                                }
                            }
                            console.log(completedUserTasks);
                            console.log(requestedUserTasks);
                            console.log(currentUserTasks);

                            return res.render('kanbanProjectStatus', {
                                'totalTasks': userTasks.card
                            });
                        }
                    }
                });

            }
        )
        ;


    }

    this.updateTask = function (req, res, next) {

        var userName = contentObj.userNameSession;
        var sprintID, taskID, userSDLC;

        users.getTenantFields(userName, function (err, userDetails) {    // user table
            if (err)
                throw err;

            userSDLC = userDetails.SoftwareDevelopmentMethod;
            switch (userSDLC) {
                case "Scrum":
                    sprintID = contentObj.currentSprintID;
                    taskID = contentObj.currentTaskID;
                    break;

                case "Kanban":
                    taskID = req.params.cardID;
                    console.log("Hellllllllllllllllllllloooooooooooooo" + taskID);
                    break;

                case "Waterfall":
                    break;

            }

            //sprintID = sprintID || {};
            //taskID = taskID || {};
            users.removeTaskDetails(userName, userSDLC, taskID, sprintID, function (err, writeObject) {    // multitenant: removal
                if (err)
                    throw err;

                users.updateTaskDetails(userName, userSDLC, req.body, function (err, updatedTask) {  // multitenant: update
                    if (err)
                        throw err;
                    res.redirect('/projectStatus');
                });
                console.log("inside content.js --> " + writeObject);

            });
        });

    }

    this.addNewScrumTask = function (req, res, next) {
        var userName = contentObj.userNameSession;
        var mySDLC = contentObj.currentSLDC;

        users.updateTaskDetails(userName, mySDLC, req.body, function (err, result) {
            if (err) {
                console.log("Error: inside addNewScrumTask");
                throw err;
            }
            else {
                res.redirect('/projectStatus');
            }
        });
    }

    this.displayNewScrumTaskForm = function (req, res, next) {
        var sprintID = req.param.sprintID;
        exports.addTaskForSprintID = sprintID;
        var userTaskColumns = contentObj.sessionTaskColumns;
        console.log("im in displayNewScrumTaskForm -> sessionTaskColumns .. " + userTaskColumns);

        res.render('newScrumTask', {"sprintID": sprintID, "userTaskColumns": userTaskColumns});
    }

    this.deleteScrumTask = function (req, res, next) {
        var currentSprintID = 1;
        var userName = contentObj.userNameSession;
        var mySDLC = contentObj.currentSLDC;
        var deleteID = req.param("taskID");
        users.removeTaskDetails(userName, mySDLC, deleteID, currentSprintID, function (err, result) {
            if (err) {
                throw err;
            }
            else {
                res.redirect('/projectStatus');
            }
        })
    }

    this.displaySignInPage = function (req, res, next) {
        res.render('signin');
    }

    this.displaySignUpPage = function (req, res, next) {
        res.render('signup');
    }

    this.displayEditScrumActivity = function (req, res, next) {
        "use strict";
        var taskID = req.params.taskID;
        var sprintID = parseInt(req.params.sprintID);
        exports.currentTaskID = taskID;
        exports.currentSprintID = sprintID;
        var userName = contentObj.userNameSession;
        var tenantData = [], k = 0;


        users.getTenantFields(userName, function (err, tenantFields) {    // get metadata from USER table
            users.getScrumTaskInfo(userName, taskID, sprintID, function (err, userTask) {   // get TxN data from MULTITENANT table

                if (err)
                    throw err;


                console.log("#@## ..." + userTask);
                var taskDataKey = userTask.task;
                var sprintID = userTask.sprintID;
                for (var i = 0; i < taskDataKey.length; i++) {
                    if (taskDataKey[i].id == taskID) {
                        var jsonObject = taskDataKey[i];
                        console.log(jsonObject);
                        for (var prop in jsonObject) {
                            //console.log("Key:" + prop);
                            //console.log("Value:" + jsonObject[prop]);
                            for (var j = 0; j < tenantFields.userTaskFields.length; j++) {
                                if (prop == tenantFields.userTaskFields[j]) {
                                    tenantData[k] = jsonObject[prop];
                                    k++;
                                }
                            }
                        }
                    }
                }
                console.log("in routes.." + JSON.stringify(tenantFields));
                res.render('editScrumActivity', {
                    'tenantFields': tenantFields,
                    'tenantData': tenantData,
                    'sprintID': sprintID
                });//console.log("TenantData"+tenantData);
            });
        });

    }

    this.displayAddTask = function (req, res, next) {

        var userName = contentObj.userNameSession;
        users.getTenantFields(userName, function (err, tenantFields) {
            res.render('addNewKabanCard', {'tenantFields': tenantFields});
        });

    }

    this.createNewTask = function (req, res, next) {

        var userName = contentObj.userNameSession;
        var cardID = Math.floor((Math.random() * 1000) + 1);
        users.createNewTask(userName, cardID, req.body, function (err, successfulCreation) {
            res.redirect('/projectStatus');
        });
    }

    this.deleteTask = function (req, res, next) {

        var userName = contentObj.userNameSession;
        var cardID = req.params.cardID;
        users.deleteTask(userName, cardID, function (err, deletedTask) {
            res.redirect('/projectStatus');
        });

    }

    this.waterfallDisplayEditActivity = function (req, res, next) {
        var taskId = req.params.taskId;
        var tenantData = [], j = 0;
        var userName = contentObj.userNameSession;
        users.getWaterfallTaskFields(userName, function (err, tenantFields) {
            users.getWaterfallTaskData(userName, taskId, function (err, taskData) {
                for (var prop in taskData) {
                    for (var i = 0; i < tenantFields.userTaskFields.length; i++) {
                        if (prop == tenantFields.userTaskFields[i]) {
                            tenantData[j] = taskData[prop];
                            j++;
                        }
                    }

                }
                console.log("tenantFields...wf" + JSON.stringify(tenantFields));
                console.log("tenantData...wf" + tenantData);
                res.render('editActivityWaterfall', {
                    'tenantFields': tenantFields.userTaskFields,
                    'tenantData': tenantData
                });//console.log("TenantData"+tenantData);
            });
        });
    }

    this.waterfallUpdateTask = function (req, res, next) {
        var taskId = req.params.taskId;
        var userName = contentObj.userNameSession;
        users.removeWaterfallTaskDetails(userName, taskId, function (err, writeObject) {
            if (err)
                throw err;
            users.updateWaterfallTaskDetails(userName, req.body, function (err, updatedTask) {
                if (err)
                    throw err;
                res.redirect('/projectStatus');
            })
        });

    }

    this.waterfallDeleteTask = function (req, res, next) {
        var userName = contentObj.userNameSession;
        var taskId = req.params.taskId;
        users.removeWaterfallTaskDetails(userName, taskId, function (err, deletedTask) {
            res.redirect('/projectStatus');
        });
    }

    this.addWaterfallTask = function (req, res, next) {     // GET function

        var userName = contentObj.userNameSession;
        users.getWaterfallTaskFields(userName, function (err, tenantFields) {
            console.log("inside GET addWaterfallTask tenantFields: " + tenantFields);
            res.render('addNewWaterfallTask', {'tenantFields': tenantFields.userTaskFields});
        });
    }

    this.createWaterfallTask = function (req, res, next) {      // POST req
        var userName = contentObj.userNameSession;
        users.createWaterfallTask(userName, req.body, function (err, createdResult) {
            res.redirect('/projectStatus');
        });
    }


}


module.exports = ContentHandler;