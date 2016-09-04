//meteor things
import {
    Meteor
} from 'meteor/meteor';
import {
    Mongo
} from 'meteor/mongo';

// Defines who the admins are - not added
var superadmins = [
    "ybq987@gmail.com",
    "ksjdragon@gmail.com",
    //"aravagarwal3073@gmail.com"
];

var worktype = ["test", "quiz", "project", "normal", "other"];

// Adds roles to superadmins
// Not necessary on every run
// Makes superadmins

for (var i = 0; i < superadmins.length; i++) {
    superadmin = Meteor.users.findOne({
        "services.google.email": superadmins[i]
    });
    if (superadmin && !(Roles.userIsInRole(superadmin._id, 'superadmin'))) {
        Roles.addUsersToRoles(superadmin._id, 'superadmin');
    }
}

Meteor.publish('schools', function() {
    return schools.find();
});

// Returns the code for classes (for debug)

Meteor.publish('classes', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return classes.find();
    } else {
        // Return user classes and all _public_ classes.
        var userprofile = Meteor.users.findOne(this.userId);
        if (userprofile !== undefined && userprofile.profile.classes !== undefined) {
            return classes.find({
                $or: [{
                    privacy: false
                }, {
                    _id: {
                        $in: userprofile.profile.classes
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

// Gives everything in work if superadmin

Meteor.publish('work', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return work.find();
    } else {
        var userprofile = Meteor.users.findOne(this.userId);
        if (userprofile !== undefined && userprofile.profile.classes !== undefined) {
            return work.find({
                // Only return work of enrolled classes
                class: {
                    $in: userprofile.profile.classes.concat(Meteor.userId())
                }
            });
        } else {
            Meteor.call('createProfile', this.userId);
            return work.find({
                _id: null
            });
        }

    }

});

//Returns issues in sites (not implemented on client)

Meteor.publish('requests', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return requests.find();
    } else {
        return requests.find({
            requestor: this.userId
        });
    }
});

//Publishes every-persons email and user-ids

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
    // Stuff that is accessible in client

    // Generates private codes for classes - like google classroom
    'genCode': function(privacy) {
        if (privacy) {
            var currcode = Math.random().toString(36).substr(2, 6);
            while (classes.findOne({
                    code: currcode
                })) {
                currcode = Math.random().toString(36).substr(2, 6);
            }
            return currcode;
        } else {
            return "";
        }
    },

    // School Functions

    // Ability to create schools for selections
    'createSchool': function(schoolname) {
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            schools.insert({
                name: schoolname
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    // Deletes school
    'deleteSchool': function(schoolId) {
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            schools.remove({
                _id: schoolId
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },

    // Class Functions
    'createClass': function(input) {
        classes.schema.validate(input);
        if (Meteor.user() &&
            classes.find({
                status: false,
                admin: Meteor.userId()
            }).fetch().length < 5 &&
            schools.findOne({
                name: input.school
            })) {
            input.status = Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']);
            input.admin = Meteor.userId();
            Meteor.call('genCode', function(error, result) {
                input.code = result;
            });
            if (input.category != "class" && input.category != "club") {
                input.category = "other";
            }
            input.subscribers = [];
            input.moderators = [];
            input.banned = [];

            classes.insert(input, function(err, result) {
                Meteor.call('joinClass', [result, input.code]);
            });

        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    // For class admins to get code
    'getCode': function(classId) {
        var foundclass = classes.find({
            _id: classId
        });
        if (foundclass && foundclass.admin == Meteor.userId()) {
            return foundclass.code;
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    'changeAdmin': function(input) {
        var userId = input[0];
        var classId = input[1];
        var found = Meteor.users.find({
            _id: userId
        });
        var foundclass = classes.find({
            _id: classId
        });
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||

            (found && foundclass && foundclass.admin == Meteor.userId() &&
                !_.contains(foundclass.banned, userId) &&
                _.contains(foundclass.subscribers, userId)
            )) {
            classes.update({
                _id: classId
            }, {
                $set: {
                    admin: userId
                }
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },

    // Allows someone to manage the class

    'trackUserInClass': function(input) {
        var userId = input[0];
        var classId = input[1];
        var userlist = input[2];
        var dowhat = input[3];
        var foundclass = classes.findOne({
            _id: classId
        });
        classlist = foundclass[userlist];
        var index = ["moderators", "banned"].indexOf(userlist);
        var set = foundclass;
        var presence = false;
        if (dowhat) {
            set[userlist] = set[userlist].concat(userId);
            presence = true;
        } else {
            set[userlist] = _.without(set[userlist], userId);
        }

        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||

            (foundclass && foundclass.admin == Meteor.userId() && index !== -1 &&
                (index === 0 ^ _.contains(foundclass.moderators, Meteor.userId())) &&
                (!_.contains(classlist, userId) ^ presence))) {
            classes.update({
                _id: classId
            }, {
                $set: set
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    'deleteClass': function(classid) {
        var found = classes.findOne({
            _id: classid
        });
        if (Meteor.user() && found &&
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
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
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

        if (Meteor.user() &&
            ((found && _.contains(Meteor.user().profile.classes, input.class) &&
                    !_.contains(found.banned, Meteor.userId())) ||
                (Meteor.userId() === input.class)) &&
            input.dueDate instanceof Date && input.dueDate.getTime() >= ref &&
            _.contains(worktype, input.type) &&
            input.name.length <= 50 && input.description.length <= 150) {

            input.confirmations = [Meteor.userId()];
            input.reports = [];
            input.done = [];
            input.numberdone = 0;
            input.comments = [];
            work.insert(input);
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }

    },
    'editWork': function(change) {
        var ref = new Date();
        ref.setHours(0, 0, 0, 0);
        ref = ref.getTime();
        var currentwork = change._id;
        var currentclass = classes.findOne({
            _id: currentwork.class
        });
        var authorized = currentclass.moderators.concat(currentclass.admin);
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            work.update({
                _id: currentwork._id
            }, {
                $set: change
            });
        } else if ((_.contains(authorized, Meteor.userId()) ||
                   currentwork.class === Meteor.userId() ||
                   Meteor.userId() === currentwork.creator) &&
                   change.name.length <= 50 && change.description.length <= 150 &&
                   change.dueDate instanceof Date && change.dueDate.getTime() >= ref &&
                   _.contains(worktype, change.type)){
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
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
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
        if (typeof comment === "string" && comment.length <= 200 &&
            _.contains(currentclass.subscribers, Meteor.userId()) &&
            !_.contains(currentclass.banned, Meteor.userId())) {
            var commentInfo = {
                "comment": input[0],
                "user": user,
                "date": new Date()
            };
            var comments = workobject.comments.concat(commentInfo);
            work.update({
                _id: input[1]
            }, {
                $set: {
                    comments: comments
                }
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },

    'toggleWork': function(input) {
        var workobject = work.findOne({
            _id: input[0]
        });
        var currentclass = classes.findOne({
            _id: workobject.class
        });
        if (_.contains(currentclass.subscribers, Meteor.userId()) && _.contains(["confirmations", "reports", "done"], input[1])) {
            var userindex = workobject[input[1]].indexOf(Meteor.userId());
            if (userindex === -1) {
                workobject[input[1]] = workobject[input[1]].concat(Meteor.userId());
                if (input[1] === "confirmations" &&
                    _.contains(workobject.reports, Meteor.userId())) {
                    workobject.reports.splice(userindex, 1);
                } else if (input[1] === "reports" &&
                    _.contains(workobject.confirmations, Meteor.userId())) {
                    workobject.confirmations.splice(userindex, 1);
                }
            } else {
                workobject[input[1]].splice(userindex, 1);
            }
            work.update({
                _id: input[0]
            }, {
                $set: workobject
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    'deleteWork': function(workId) {
        var currentwork = wokr.findOne({_id: workId});
        var currentclass = classes.findOne({
            _id: currentwork.class
        });
        var authorized = currentclass.moderators.concat(currentclass.admin);
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            _.contains(authorized, Meteor.userId()) || Meteor.userId() === currentwork.class) {
            work.remove({
                _id: workId
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
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
    },
    'createProfile': function(userId) {
        var current = Meteor.users.findOne({
            _id: userId
        }).profile;
        current.classes = [];
        current.preferences = {
            "theme": "light",
            "mode": "classes",
            "timeHide": 1,
            "done": true
        };
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
            !_.contains(prof.classes, change)) {
            var foundsubs = found.subscribers;
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
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
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
            !_.contains(current.classes, found._id)) {
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
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
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
                    throw new Meteor.Error("unauthorized", "You are currently the admin of this class. Transfer ownership in order to leave this class.");
                }
            }

        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },

    // Admin Functions
    'createAdmin': function(userId) {
        if (Roles.userIsInRole(Meteor.user()._id, ['superadmin'])) {
            Roles.addUsersToRoles(userId, ['admin']);
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    'deleteAdmin': function(userId) {
        if (Roles.userIsInRole(Meteor.user()._id, ['superadmin'])) {
            Roles.removeUsersToRoles(userId, ['admin']);
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    'createRequest': function(request) {
        if (request.length <= 500 && Meteor.userId() !== null &&
            _.contains(['bug', 'feature'], request.type)) {
            requests.insert({
                requestor: Meteor.userId(),
                request: request.content,
                type: request.type,
                info: request.info,
                timeRequested: new Date()
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    'deleteRequest': function(requestId) {
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            requests.remove({
                _id: requestId
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    }
});
