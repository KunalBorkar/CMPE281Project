var bcrypt = require('bcrypt-nodejs')
    , MongoDb = require("mongodb");

/* The UsersDAO must be constructed with a connected database object */
function UsersDAO(db) {
    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof UsersDAO)) {
        console.log('Warning: UsersDAO constructor called without "new" operator');
        return new UsersDAO(db);
    }

    var users = db.collection("user");
    var scrum = db.collection("scrum");
    var multiTenant = db.collection("multitenant");         // Scrum
    var kanban = db.collection("kanban");                   // Kanban
    var waterfall = db.collection("waterfall");

    this.registerUser = function (firstName, lastName, userName, password, softDevelopmentMethod, callback) {
        "use strict";

        var salt = bcrypt.genSaltSync();
        var password_hash = bcrypt.hashSync(password, salt);

        if (softDevelopmentMethod == "Waterfall") {
            var userTaskFields = ['taskId', 'taskName', 'taskDuration', 'taskStartDate', 'taskFinishDate', 'taskStatus', 'taskPredecessors', 'taskResources', 'taskStatus'];
        }
        else {
            if (softDevelopmentMethod == "Scrum") {
                var userTaskFields = ['id', 'task_name', 'owner', 'initial_estimate', 'day1', 'day2', 'day3', 'day4', 'day5'];
            }
            else {
                var userTaskFields = ['id', 'title', 'priority', 'deadline', 'description', 'type', 'status', 'hoursLogged'];
            }
        }

        var user = {
            '_id': userName,
            'firstName': firstName,
            'lastName': lastName,
            'password': password_hash,
            'SoftwareDevelopmentMethod': softDevelopmentMethod,
            'userTaskFields': userTaskFields
        };

        users.insert(user, function (err, result) {
            if (softDevelopmentMethod == 'Kanban') {
                var kanban = {
                    'userName': userName,
                    'boardID': 1,
                    'boardDescription': "My First Kanban Board",
                    'startDate': "01/01/2000",
                    'endDate': "01/01/2002",
                    'card': []
                };
                multiTenant.insert(kanban, function (err, defaultDoc) {
                    callback(err, defaultDoc);
                });
            }
            callback(err, result);


        });

    }

    this.validateLogin = function (username, password, callback) {
        "use strict";

        users.findOne({'_id': username}, function (err, user) {
            "use strict";

            if (err) return callback(err, null);

            if (user) {
                if (bcrypt.compareSync(password, user.password)) {
                    callback(null, user);
                }
                else {
                    var invalid_password_error = new Error("Invalid password");
                    // Set an extra field so we can distinguish this from a db error
                    invalid_password_error.invalid_password = true;
                    callback(invalid_password_error, null);
                }
            }
            else {
                var no_such_user_error = new Error("User: " + user + " does not exist");
                // Set an extra field so we can distinguish this from a db error
                no_such_user_error.no_such_user = true;
                callback(no_such_user_error, null);
            }
        });
    }

    this.getTasks = function (userName, userSDLC, callback) {
        "use strict";
        console.log("logged userName: " + userName);
        var getUser = {"userName": userName};

        switch (userSDLC) {
            case "Kanban":
                kanban.findOne(getUser, function (err, user) {
                    console.log("logged user: " + user);
                    callback(null, user);
                });
                break;

            case "Scrum":
                multiTenant.findOne(getUser, function (err, user) {
                    callback(null, user);
                });
                break;

            case "Waterfall":

                var taskArray = [], count = 0;
                waterfall.find(getUser).toArray(function (err, userTasks) {
                    console.log("data waterfall: " + JSON.stringify(userTasks));
                    //userTasks.forEach(function (task) {
                    //    if (task.taskStatus == "In Progress") {
                    //        taskArray.push(task);
                    //    }
                    //    count++;
                    //    if (count == userTasks.length) {
                    //        callback(null, taskArray);
                    //    }
                    //});
                    callback(null, userTasks);

                });

                break;


        }
    }

    this.updateTaskDetails = function (userName, userSDLC, requestBody, callback) {
        if (userSDLC == "Kanban") {
            kanban.update({"userName": userName}, {$push: {'card': requestBody}}, function (err, updatedTask) {
                callback(null, updatedTask);
            });
        }
        else if (userSDLC == "Scrum") {
            multiTenant.update({"userName": userName}, {$push: {"task": requestBody}}, function (err, updatedTask) {
                callback(null, updatedTask);
            });
        }
        else if (userSDLC == "Waterfall") {

        }

    }

    this.getTenantFields = function (userName, callback) {
        var getTenantData = {'_id': userName};
        users.findOne(getTenantData, function (err, userFields) {
            callback(null, userFields);
        });
    }

    this.getScrumTaskInfo = function (userName, taskID, sprintID, callback) {
        console.log("t: " + taskID + "s: " + sprintID + "u: " + userName);
        var getTenantData = {"userName": userName, "sprintID": parseInt(sprintID), "task.id": taskID};
        multiTenant.findOne(getTenantData, function (err, userTask) {
            console.log("inside getScrumTaskInfo() -->> " + JSON.stringify(userTask));
            return callback(null, userTask);
        });
    }

    this.removeTaskDetails = function (userName, userSDLC, taskID, sprintID, callback) {
        if (userSDLC == "Kanban") {
            kanban.update({"userName": userName}, {$pull: {'card': {id: taskID}}}, function (err, userFields) {
                callback(null, userFields);
            });
        }
        else if (userSDLC == "Scrum") {
            multiTenant.update({
                "userName": userName,
                "sprintID": sprintID
            }, {$pull: {"task": {id: taskID}}}, function (err, userFields) {
                callback(null, userFields);
            });
        }
        else if (userSDLC == "Waterfall") {

        }
    }

    /*    this.removeTaskDetailsKanban = function (userName, cardID, callback) {

     multiTenant.update({"userName": userName }, { $pull: { 'card': { id: cardID } } }, function (err, userFields) {
     callback(null, userFields);
     });
     }*/

    this.createNewTask = function (userName, cardID, cardBody, callback) {
        //cardBody.id = cardID;
        kanban.update({'userName': userName}, {$push: {'card': cardBody}}, function (err, createdTask) {
            callback(null, createdTask);
        });
    }

    this.deleteTask = function (userName, cardID, callback) {
        kanban.update({"userName": userName}, {$pull: {'card': {id: cardID}}}, function (err, userFields) {
            callback(null, userFields);
        });
    }

    this.getWaterfallTaskFields = function (userName, callback) {
        users.findOne({'_id': userName}, function (err, tenantFields) {
            callback(null, tenantFields);
        });
    }
    this.getWaterfallTaskData = function (userName, taskId, callback) {
        waterfall.findOne({'userName': userName, 'taskId': taskId}, function (err, taskData) {
            callback(null, taskData);
        })
    }

    this.removeWaterfallTaskDetails = function (userName, taskId, callback) {
        waterfall.remove({"userName": userName, 'taskId': taskId}, function (err, userFields) {
            callback(null, userFields);
        });
    }

    this.updateWaterfallTaskDetails = function (userName, taskBody, callback) {
        waterfall.insert({'userName': userName, 'taskId': taskBody.taskId}, function (err, firstInsertion) {
            taskBody.userName = userName;
            waterfall.update({
                'userName': userName,
                'taskId': taskBody.taskId
            }, taskBody, function (err, secondInsertion) {
                callback(err, secondInsertion);
            });
        });
    }

    this.createWaterfallTask = function (userName, taskBody, callback) {
        waterfall.insert({'userName': userName, 'taskId': taskBody.taskId}, function (err, firstInsertion) {
            taskBody.userName = userName;
            waterfall.update({
                'userName': userName,
                'taskId': taskBody.taskId
            }, taskBody, function (err, secondInsertion) {
                callback(err, secondInsertion);
            });
        });


    }

}

module.exports.UsersDAO = UsersDAO;
