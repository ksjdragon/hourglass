/* jshint esversion: 6 */
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

Meteor.publish('schools', function() {
    return schools.find();
});

// Returns the code for classes (for debug)

Meteor.publish('classes', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return classes.find();
    } else if (this.userId !== null) {
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
    } else if (this.userId !== null) {
        var userprofile = Meteor.users.findOne(this.userId);
        if (userprofile !== undefined && userprofile.profile.classes !== undefined) {
            return work.find({
                // Only return work of enrolled classes
                class: {
                    $in: userprofile.profile.classes
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
                'services.google.email': 1,
                'services.google.picture': 1,
                'profile.banner': 1,
                'profile.grade': 1,
                'profile.description': 1,
                'profile.name': 1,
                'profile.school': 1
            }
        });
    }
});

// Allows only superadmins to edit collections from client
Security.permit(['insert', 'update', 'remove']).collections([schools, classes, work]).ifHasRole('superadmin');


var errors = [
    ["unauthorized", "Sorry, you are not authorized to complete this action."],
    ["unauthorized", "You have too many unverified classes right now. Try again later."],
    ["matching", "The school you have requested does not exist."],
    ["matching", "This teacher is already teaching a class elsewhere!"],
    ["unauthorized", "You are not an administrator of this class."],
    ["matching", "This class does not exist."],
    ["matching", "This user does not exist"],
    ["matching", "This user is banned from this class"],
    ["matching", "This user is not enrolled in the class"],
    ["trivial", "The past is in the past! Let it go!"],
    ["trivial", "This name is too long"],
    ["trivial", "This description is too long"],
    ["unauthorized", "You are not the creator of this work."],
    ["trivial", "This comment is too long."],
    ["unauthorized", "Incorrect code, try again."],
    ["trivial", "You are already enrolled in this class."],
    ["trivial", "This request is too long."],

    ["other", "Error could not be processed"]
];

function securityCheck(checklist, input) {
    var error = -1;
    var results = [];
    for(var checkpoint = 0; checkpoint < checklist.length - 1; checklist++) {
        if (Array.isArray(checkpoint)) {
            results.push(securityCheck(checkpoint, input));
            continue;
        }
        switch (checkpoint) {
        // Superadmin
        case 0:
            if (!Roles.userIsInRole(Meteor.userId(), ['superadmin'])) error = 0;
            break;
        // Any admin
        case 1:
            if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) error = 0;
            break;
        // Unverified classes
        case 2:
            if (classes.find({status:false, admin: Meteor.userId()}).fetch().length > 5) error = 1;
            break;
        // School existence
        case 3:
            if (!schools.findOne({name: input.school})) error = 2;
            break;
        // TODO: teachers with same name
        // Duplicate classes
        case 4:
            if (classes.findOne({school: input.school, status: true, privacy: false, teacher: input.teacher, hour: input.hour}) || (input.teacher === "" && input.hour === "")) error = 3;
            break;
        // Class admin
        case 5:
            if (input.admin !== Meteor.userId) error = 4;
            break;
        // Class existence
        case 6:
            if (!input) error = 5;
            break;
        // User existence
        case 7:
            if (!input) error = 6;
            break;
        // Not banned
        case 8:
            if (_.contains(input.banned, input.userId)) error = 7;
            break;
        // Subscribed
        case 9:
            if (!_.contains(input.subscribers, input.userId)) error = 8;
            break;
        // Date is today or onward
        case 10:
            var ref = new Date();
            ref.setHours(0, 0, 0, 0);
            ref = ref.getTime();
            if (ref > input.dueDate.getTime()) error = 9;
            break;
        case 11:
            if (input.name > 50) error = 10;
            break;
        case 12:
            if (input.description > 150) error = 11;
            break;
        case 13:
            if (!_.contains(input.moderators.concat(input.admin)), Meteor.userId()) error = 4;
            break;
        case 14:
            if (Meteor.userId() !== input.creator) error = 12;
            break;
        case 15:
            if (input.comment > 200) error = 13;
            break;
        case 16:
            if (input.class !== Meteor.userId()) error = errors.length - 1;
            break;
        case 17:
            if (input.code !== pass && input.privacy) error = 14;
            break;
        case 18:
            if (_.contains(input.classes, input.classId)) error = 15;
            break;
        case 19:
            if (input.content.length > 500) error = 16;
            break;
        }
        results.push(error);
    }
    error = results.find(function(result){return result >= 0;});
    if (checklist[checklist.length - 1] && error !== undefined) return error;
    else if (results.find(function(result){return result === -1;}) === undefined) return results[0];
    else return -1;
}

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
            if (classes.find({
                    status: true,
                    privacy: false,
                    teacher: input.teacher,
                    hour: input.hour
                }).fetch().length < 1 ||
                input.teacher === "" ||
                input.hour === "") {
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
                throw new Meteor.Error("overlap", "This teacher is already teaching a class elsewhere!");
            }

        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    'approveClass': function(classId) {
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            var currentclass = classes.findOne({
                _id: classId
            });

            classes.update({
                _id: classId
            }, {
                $set: {
                    status: !currentclass.status
                }
            });
        }
    },
    // For class admins to get code
    'getCode': function(classId) {
        var foundclass = classes.findOne({
            _id: classId
        });
        if (foundclass !== undefined && foundclass.admin === Meteor.userId()) {
            return (foundclass.code === '') ? "None" : foundclass.code;
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
        var currentwork = work.findOne({
            _id: change._id
        });
        var currentclass = classes.findOne({
            _id: currentwork.class
        });
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            work.update({
                _id: currentwork._id
            }, {
                $set: change
            });
        } else if ((currentwork.class === Meteor.userId() ||
                _.contains(currentclass.moderators.concat(currentclass.admin), Meteor.userId()) ||
                Meteor.userId() === currentwork.creator) &&
            change.name.length <= 50 && change.description.length <= 150 &&
            change.dueDate instanceof Date && change.dueDate.getTime() >= ref &&
            _.contains(worktype, change.type)) {
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
            (workobject.class === Meteor.userId() ||
                (_.contains(currentclass.subscribers, Meteor.userId()) &&
                    !_.contains(currentclass.banned, Meteor.userId())))) {
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
        if ((Meteor.userId() === workobject.class || _.contains(currentclass.subscribers, Meteor.userId())) && _.contains(["confirmations", "reports", "done"], input[1])) {
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
        var currentwork = work.findOne({
            _id: workId
        });
        var currentclass = classes.findOne({
            _id: currentwork.class
        });
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            currentwork.class === Meteor.userId() ||
            _.contains(currentclass.moderators.concat(currentclass.admin), Meteor.userId()) || Meteor.userId() === currentwork.class) {
            work.remove({
                _id: workId
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },

    // User Functions
    'editProfile': function(change) {
        var refyear = new Date().getUTCFullYear();
        var current = Meteor.user().profile;
        current = {
            "__proto__": current.__proto__,
            "school": change.school,
            "grade": change.grade,
            "classes": current.classes,
            "description": change.description,
            "banner": change.banner,
            "preferences": change.preferences,
            "name": current.name
        };
        if (current.description && current.description.length > 50) {
            current.description = current.description.slice(0, 50);
        }
        if (current.grade <= refyear || current.grade >= refyear + 4) {
            current.grade = refyear;
        }
        Meteor.users.update({
            _id: Meteor.userId()
        }, {
            $set: {
                profile: current
            }
        });
    },
    'reorderClasses': function(newOrder) {
        var current = Meteor.user().profile;
        if (newOrder.every(elem => _.contains(current.classes, elem)) &&
            newOrder.length === current.classes.length) {
            current.classes = newOrder;
            Meteor.users.update({
                _id: Meteor.userId()
            }, {
                $set: {
                    profile: current
                }
            });
        } else {
            throw new Meteor.Error("unauthorized", "You are not authorized to complete this action.");
        }
    },
    'createProfile': function(userId) {
        var currentuser = Meteor.users.findOne({
            _id: userId
        });
        var current = currentuser.profile;
        current.banner = "/Banners/defaultcover.jpg";
        current.classes = [userId];
        current.preferences = {
            "theme": themeColors.lux,
            "mode": "classes",
            "timeHide": 1,
            "done": true,
            "hideReport": true
        };

        if (_.contains(superadmins, currentuser.services.google.email)) {
            Roles.addUsersToRoles(userId, 'superadmin');
            Roles.addUsersToRoles(userId, 'admin');
        }

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
            _id: change
        });
        if (Meteor.user() !== null &&
            found !== null &&
            (pass === found.code || found.privacy === false) &&
            (found.status || found.admin === Meteor.userId()) &&
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
        if (request.content.length <= 500 && Meteor.userId() !== null) {
            requests.insert({
                requestor: Meteor.userId(),
                request: request.content,
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
