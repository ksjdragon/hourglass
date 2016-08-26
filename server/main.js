import {
    Meteor
} from 'meteor/meteor';
import {
    Mongo
} from 'meteor/mongo';

superadmins = [
    "ybq987@gmail.com",
    "ksjdragon@gmail.com"
];
worktype = ["test", "quiz", "project", "normal", "other"];
var possiblelist = ["moderators", "banned"];

// Adds roles to superadmins
// Not necessary on every run
for (var i = 0; i < superadmins.length; i++) {
    var superadmin = superadmins[i];
    if (Meteor.users.findOne({
            "services.google.email": superadmin
        })) {
        var userId = Meteor.users.findOne({
            "services.google.email": superadmin
        })._id;
        Roles.addUsersToRoles(userId, ['superadmin']);
    }
}

Meteor.publish('schools', function() {
    return schools.find();
});

Meteor.publish('classes', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return classes.find();
    } else {
        // Return user classes (if private) and public classes.
        userclasses = Meteor.users.findOne(this.userId).profile.classes;
        if (userclasses !== undefined) {
            return classes.find({
                $or: [{
                    privacy: false
                }, {
                    _id: {
                        $in: Meteor.users.findOne(this.userId).profile.classes
                    }
                }]
            }, {
                // Return non-sensitive fields
                fields: {
                    school: 1,
                    name: 1,
                    hour: 1,
                    teacher: 1,
                    admin: 1,
                    status: 1,
                    privacy: 1,
                    category: 1,
                    moderators: 1,
                    banned: 1,
                    subscribers: 1
                }
            });
        } else {
            Meteor.call('createProfile', this.userId);
            return classes.find({
                _id: null
            });
        }
    }
});

Meteor.publish('work', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return work.find();
    } else {
        userclasses = Meteor.users.findOne(this.userId).profile.classes;
        if (userclasses !== undefined) {
        return work.find({
            // Only return work of enrolled classes
            class: {
                $in: Meteor.users.findOne(this.userId).profile.classes
            }
        });
    } else {

                Meteor.call('createProfile', this.userId);
                return classes.find({_id: null});
            }

    }

});

Meteor.publish('requests', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return requests.find();
    } else {
        return requests.find({
            requestor: this.userId
        });
    }
});

Meteor.publish('users', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return Meteor.users.find();
    } else {
        return Meteor.users.find({}, {
            // Only return necessary fields
            fields: {
                'services.google.email': 1
            }
        });
    }
});

// Allows only superadmins to edit collections from client
Security.permit(['insert', 'update', 'remove']).collections([schools, classes, work]).ifHasRole('superadmin');


Meteor.methods({
    'genCode': function() {
        currcode = Math.random().toString(36).substr(2, 6);
        while (classes.findOne({
                code: currcode
            }) !== undefined) {
            currcode = Math.random().toString(36).substr(2, 6);
        }
        return currcode;
    },

    // School Functions
    'createSchool': function(schoolname) {
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            schools.insert({
                name: schoolname
            });
        } else {
            throw "Unauthorized";
        }
    },
    'deleteSchool': function(schoolId) {
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            schools.remove({
                _id: schoolId
            });
        } else {
            throw "Unauthorized";
        }
    },

    // Class Functions
    'createClass': function(input) {
        classes.schema.validate(input);
        if (Meteor.user() !== null &&
            classes.find({
                status: false,
                admin: Meteor.userId()
            }).fetch().length < 5 &&
            schools.findOne({
                name: input.school
            }) !== null) {
            if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
                input.status = true;
            } else {
                input.status = false;
            }
            input.subscribers = [];
            input.admin = Meteor.userId();
            if (input.privacy) {
                Meteor.call('genCode', function(error, result) {
                    input.code = result;
                });
            } else {
                input.code = "";
            }
            if (input.category != "class" && input.category != "club") {
                input.category = "other";
            }
            input.moderators = [];
            input.banned = [];

            classes.insert(input, function(err, result) {
                Meteor.call('joinClass', [result, input.code]);
            });

            return 1;
        } else {
            throw "Unauthorized";
        }
    },
    'changeAdmin': function(input) {
        var found = Meteor.users.find({
            _id: input[0]
        });
        var foundclass = classes.find({
            _id: input[1]
        });
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            classes.update({
                _id: input[1]
            }, {
                $set: {
                    admin: input[0]
                }
            });
        } else if (found && foundclass && foundclass.admin == Meteor.userId() &&
            foundclass.banned.indexOf(input[0]) === -1 &&
            foundclass.subscribers.indexOf(input[0]) !== -1) {
            classes.update({
                _id: input[1]
            }, {
                $set: {
                    admin: input[0]
                }
            });
        } else {
            throw "Unauthorized";
        }
    },
    'trackUserInClass': function(input) {
        var foundclass = classes.findOne({
            _id: input[1]
        });
        var userlist = input[2];
        var index = possiblelist.indexOf(input[2]);
        var set = {};
        set[userlist] = foundclass[userlist].concat(input[0]);
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            classes.update({
                _id: input[1]
            }, {
                $set: set
            });
        } else if (foundclass && foundclass.admin == Meteor.userId() && index !== -1 &&
            (index === 1 || foundclass.moderators.indexOf(Meteor.userId()) !== -1) &&
            foundclass[userlist].indexOf(input[0]) === -1) {
            classes.update({
                _id: input[1]
            }, {
                $set: set
            });
        } else {
            throw "Unauthorized";
        }
    },
    'untrackUserInClass': function(input) {
        var foundclass = classes.findOne({
            _id: input[1]
        });
        var userlist = input[2];
        var index = possiblelist.indexOf(input[2]);
        var set = {};
        foundclass[userlist].splice(foundclass[userlist].indexOf(input[0]), 1);
        set[userlist] = foundclass[userlist];

        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            classes.update({
                _id: input[1]
            }, {
                $set: set
            });
        } else if (foundclass && foundclass.admin == Meteor.userId() && index !== -1 &&
            (index === 1 || foundclass.moderators.indexOf(Meteor.userId()) !== -1) &&
            foundclass[userlist].indexOf(input[0]) !== -1) {
            classes.update({
                _id: input[1]
            }, {
                $set: set
            });
        } else {
            throw "Unauthorized";
        }
    },
    'deleteClass': function(classid) {
        var found = classes.findOne({
            _id: classid
        });
        if (Meteor.user() !== null && found !== null &&
            (found.admin === Meteor.user()._id || Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']))) {
            for (var i = 0; i < found.subscribers.length; i++) {
                var current = Meteor.users.findOne({
                    _id: found.subscribers[i]
                }).profile;
                var index = current.classes.indexOf(classid);
                current.classes.splice(index, 1);
                Meteor.users.update({
                    _id: found.subscribers[i]
                }, {
                    $set: {
                        profile: current
                    }
                });
            }
            classes.remove({
                _id: classid
            });
        } else {
            throw "Unauthorized";
        }
    },

    // Work Functions
    'createWork': function(input) {
        var ref = new Date();
        ref.setHours(0, 0, 0, 0);
        ref = ref.getTime();
        input.creator = Meteor.userId();
        work.schema.validate(input);
        var found = classes.findOne({
            _id: input.class
        });

        if (Meteor.user() !== null &&
            found !== null &&
            Meteor.user().profile.classes.indexOf(input.class) !== -1 &&
            found.banned.indexOf(Meteor.userId()) === -1 &&
            input.dueDate instanceof Date && input.dueDate.getTime() >= ref &&
            worktype.indexOf(input.type) != -1 &&
            input.name.length <= 50 && input.description.length <= 150) {

            input.confirmations = [Meteor.userId()];
            input.reports = [];
            input.done = [];
            input.numberdone = 0;
            input.comments = [];
            work.insert(input);
        } else {
            throw "Unauthorized";
        }

    },
    'editWork': function(change) {
        var ref = new Date();
        ref.setHours(0, 0, 0, 0);
        ref = ref.getTime();
        var currentclass = classes.findOne({
            _id: work.findOne({
                _id: change._id
            })["class"]
        });
        var authorized = currentclass.moderators.concat(currentclass.admin);
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            work.update({
                _id: change._id
            }, {
                $set: change
            });
        } else if (authorized.indexOf(Meteor.userId()) != -1) {
            if (change.name.length <= 50 && change.description.length <= 150 && worktype.indexOf(change.type) != -1) {
                work.update({
                    _id: change._id
                }, {
                    $set: {
                        name: change.name,
                        dueDate: change.dueDate,
                        description: change.description,
                        comments: change.comments,
                        attachments: change.attachments,
                        type: change.type
                    }
                });
            }
        } else if (Meteor.userId() === work.findOne({
                _id: change._id
            }).creator) {
            if (change.name.length <= 50 && worktype.indexOf(change.type) != -1 &&
                change.dueDate instanceof Date && change.dueDate.getTime() >= ref) {
                work.update({
                    _id: change._id
                }, {
                    $set: {
                        name: change.name,
                        dueDate: change.dueDate,
                        description: change.description,
                        attachments: change.attachments,
                        type: change.type
                    }
                });
            }
        } else {
            throw "Unauthorized";
        }
    },
    'addComment': function(input) {
        var comment = input[0];
        var workobject = work.findOne({
            _id: input[1]
        });
        var currentclass = classes.findOne({
            _id: workobject.class
        });
        var user = Meteor.userId();
        foundsubs = currentclass.subscribers;
        if (typeof comment === "string" && comment.length <= 200 &&
            foundsubs.indexOf(Meteor.userId()) != -1 &&
            currentclass.banned.indexOf(Meteor.userId()) === -1) {
            var comments = workobject.comments.concat(comment);
            work.update({
                _id: input[1]
            }, {
                $set: {
                    comments: comments,
                    user: user,
                    time: new Date()
                }
            });
        } else {
            throw "Unauthorized";
        }
    },
    'toggleWork': function(input) {
        var workobject = work.findOne({
            _id: input[0]
        });
        var currentclass = classes.findOne({
            _id: workobject.class
        });
        if (currentclass.subscribers.indexOf(Meteor.userId()) != -1 && ["confirmations", "reports", "done"].indexOf(input[1]) != -1) {
            userindex = workobject[input[1]].indexOf(Meteor.userId());
            if (userindex === -1) {
                workobject[input[1]] = workobject[input[1]].concat(Meteor.userId());
            } else {
                workobject[input[1]] = workobject[input[1]].splice(userindex, 1);
            }
            work.update({
                _id: input[1]
            }, {
                $set: workobject
            });
        } else {
            throw "Unauthorized";
        }
    },
    'deleteWork': function(workId) {
        var currentclass = classes.findOne({
            _id: work.findOne({
                _id: workId
            })["class"]
        });
        var authorized = currentclass.moderators.concat(currentclass.admin);
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            authorized.indexOf(Meteor.userId()) != -1) {

            work.remove({
                _id: workId
            });
        } else {
            throw "Unauthorized";
        }
    },

    // User Functions
    'editProfile': function(change) {
        var current = Meteor.user().profile;
        current.school = change.school;
        current.grade = change.grade;
        current.classes = change.classes;
        if (!current.classes) {
            current.classes = [];
        }
        current.description = change.description;
        current.avatar = change.avatar;
        current.banner = change.banner;
        current.preferences = change.preferences;
        if (schools.findOne({
                name: current.school
            }) !== null &&
            Number.isInteger(current.grade) &&
            current.grade >= 9 && current.grade <= 12) {

            if (current.description && current.description.length > 50) {
                current.description = current.description.slice(0, 50);
            }
            Meteor.users.update({
                _id: Meteor.userId()
            }, {
                $set: {
                    profile: current
                }
            });
            return true;
        } else {
            throw "Unauthorized";
        }
    },
    'createProfile': function(userId) {
        current = Meteor.users.findOne({
            _id: userId
        }).profile;
        current.classes = [];
        Meteor.users.update({
            _id: userId
        }, {
            $set: {
                profile: current
            }
        });
    },
    'joinClass': function(input) {
        var change = input[0];
        var pass = input[1];
        var prof = Meteor.user().profile;
        var found = classes.findOne({
            _id: change,
            status: true
        });
        if (Meteor.user() !== null &&
            found !== null &&
            pass === found.code &&
            prof.classes.indexOf(change) === -1) {
            foundsubs = found.subscribers + '';
            classes.update({
                _id: found._id
            }, {
                $set: {
                    subscribers: foundsubs.concat(Meteor.userId())
                }
            });
            var current = Meteor.user().profile;
            current.classes = current.classes.concat(change);
            Meteor.users.update({
                _id: Meteor.userId()
            }, {
                $set: {
                    profile: current
                }
            });
            return true;
        } else {
            throw "Unauthorized";
        }
    },
    'joinPrivateClass': function(input) {
        var found = classes.findOne({
            status: true,
            privacy: true,
            code: input
        });
        var current = Meteor.user().profile;
        if (found !== undefined && input !== undefined &&
            current.classes.indexOf(found._id) === -1) {
            classes.update({
                _id: found._id
            }, {
                $set: {
                    subscribers: found.subscribers.concat(Meteor.userId())
                }
            });
            current.classes = current.classes.concat(found._id);
            Meteor.users.update({
                _id: Meteor.userId()
            }, {
                $set: {
                    profile: current
                }
            });
            return true;
        } else {
            throw "Unauthorized";
        }
    },
    'leaveClass': function(change) {
        if (Meteor.user() !== null) {
            var current = Meteor.user().profile;
            var index = current.classes.indexOf(change);
            if (index >= 0) {
                if (classes.findOne({
                        _id: change
                    }).admin != Meteor.userId()) {
                    current.classes.splice(index, 1);
                    Meteor.users.update({
                        _id: Meteor.userId()
                    }, {
                        $set: {
                            profile: current
                        }
                    });
                    var newstudents = classes.findOne({
                        _id: change
                    }).subscribers.splice(Meteor.userId(), 1);
                    classes.update({
                        _id: change
                    }, {
                        $set: {
                            subscribers: newstudents
                        }
                    });
                    return true;
                } else {
                    throw "You are currently the admin of this class. Transfer ownership in order to leave this class.";
                }
            }

        } else {
            throw "Unauthorized";
        }
    },

    // Admin Functions
    'createAdmin': function(userId) {
        if (Roles.userIsInRole(Meteor.user()._id, ['superadmin'])) {
            Roles.addUsersToRoles(userId, ['admin']);
        } else {
            throw "Unauthorized";
        }
    },
    'deleteAdmin': function(userId) {
        if (Roles.userIsInRole(Meteor.user()._id, ['superadmin'])) {
            Roles.removeUsersToRoles(userId, ['admin']);
        } else {
            throw "Unauthorized";
        }
    },
    'createRequest': function(request) {
        if (request.length <= 500 && Meteor.userId() !== null) {
            requests.insert({
                requestor: Meteor.userId(),
                request: request,
                timeRequested: new Date()
            });
        } else {
            throw "Unauthorized";
        }
    },
    'deleteRequest': function(requestId) {
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            requests.remove({
                _id: requestId
            });
        } else {
            throw "Unauthorized";
        }
    }
});
