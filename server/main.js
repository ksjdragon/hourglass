/* jshint esversion: 6 */
import {
    Meteor
} from 'meteor/meteor';
import {
    Mongo
} from 'meteor/mongo';

console.log("Server started!");

// Defines who the admins are - not added
var superadmins = [
    "ybq987@gmail.com",
    "ksjdragon@gmail.com",
    //"aravagarwal3073@gmail.com"
];

var worktype = ["test", "quiz", "project", "normal", "other"];

Meteor.users.allow({
    update: function(userId, doc, fields, modifier) {
        return Roles.userIsInRole(userId, ['superadmin']);
    }
});

Meteor.publish('schools', function() {
    return schools.find();
});

Meteor.publish('teachers', function() {
    return teachers.find({}, {fields: {name: 1, school: 1}});
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
                privacy: false,
                status: true,
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

Meteor.publish("personalUser", function() {
    return Meteor.users.find({_id: this.userId}, {
        fields: {
            'services': 1,
            'profile': 1
        }
    });
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
                'profile.grade': 1,
                'profile.name': 1,
                'profile.school': 1
            }
        });
    }
});

// Allows only superadmins to edit collections from client
Security.permit(['insert', 'update', 'remove']).collections([schools, classes, work]).ifHasRole('superadmin');

Accounts.validateLoginAttempt(function(info) {
    var user = info.user;
    if(info.user) {
       if(user.banned) throw new Meteor.Error(403, 'You are banned'); 
    }
    return true;
});


var errors = [
    "Success.", // 0
    ["unauthorized", "You have too many unverified classes right now. Try again later."],
    ["matching", "The school you have requested does not exist."],
    ["matching", "This teacher is already teaching a class elsewhere!"],
    ["unauthorized", "You are not an administrator of this class."],
    ["matching", "This class does not exist."], // 5
    ["matching", "This user does not exist"],
    ["matching", "This user is banned from this class"],
    ["matching", "This user is not enrolled in the class"],
    ["trivial", "The past is in the past! Let it go!"],
    ["trivial", "This name is too long"], // 10
    ["trivial", "This description is too long"],
    ["unauthorized", "You are not the creator of this work."],
    ["trivial", "This comment is too long."],
    ["unauthorized", "Incorrect code, try again."],
    ["trivial", "You are already enrolled in this class."], // 15
    ["trivial", "This request is too long."],
    ["trivial", "Not a valid work type"],
    ["unauthorized", "This class has not been approved yet"],
    ["matching", "This teacher already exists!"],
    ["trivial", "Please put the full name!"], // 20

    ["unauthorized", "Sorry, you are not authorized to complete this action."], // n - 2
    ["other", "Error could not be processed"] // n - 1
];

function securityCheck(checklist, input) {
    var error;
    var results = [];
    for(var i = 0; i < checklist.length - 1; i++) {
        var checkpoint = checklist[i];
        error = 0;
        if (Array.isArray(checkpoint)) {
            var arrayresult = securityCheck(checkpoint, input);
            results.push(arrayresult);
            continue;
        }
        switch (checkpoint) {
        // Superadmin
        case -1:
            if (!Roles.userIsInRole(Meteor.userId(), ['superadmin'])) error = errors.length - 2;
            break;
        // Any admin
        case 1:
            if (!Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) error = errors.length - 2;
            break;
        // Unverified classes
        case 2:
            if (classes.find({status:false, admin: Meteor.userId()}).fetch().length > 8) error = 1;
            break;
        // School existence
        case 3:
            if (!schools.findOne({name: input.school})) error = 2;
            break;
        // Duplicate classes
        case 4:
            if (classes.findOne({school: input.school, teacher: input.teacher, status: true, privacy: false, hour: input.hour}) || (input.teacher === "" && input.hour === "")) error = 3;
            break;
        // Class admin
        case 5:
            if (input.admin !== Meteor.userId()) error = 4;
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
            if (!(input.dueDate instanceof Date) || ref > input.dueDate.getTime()) error = 9;
            break;
        // Name too long
        case 11:
            if (typeof input.name !== "string" || input.name.length > 50) error = 10;
            break;
        // Description too long
        case 12:
            if ((typeof input.description !== "string" || input.description.length > 300) && input.description !== undefined) error = 11;
            break;
        // Moderator of class
        case 13:
            if (!_.contains(input.moderators, Meteor.userId())) error = 4;
            break;
        // Creator of work
        case 14:
            if (Meteor.userId() !== input.creator) error = 12;
            break;
        // Comment too long
        case 15:
            if (typeof input.comment !== "string" || input.comment.length > 200) error = 13;
            break;
        // Private class
        case 16:
            if (input.class !== Meteor.userId()) error = errors.length - 1;
            break;
        // Code is wrong
        case 17:
            if (input.code !== input.pass && input.privacy) error = 14;
            break;
        // Check if user is already enrolled
        case 18:
            if (_.contains(input.subscribers, input.userId)) error = 15;
            break;
        // Request too long
        case 19:
            if (typeof input.content !== "string" || input.content.length > 500) error = 16;
            break;
        // Is valid work type
        case 20:
            if (!_.contains(worktype, input.type)) error = 17;
            break;
        // Tracking in moderators or banned
        case 21:
            if (!_.contains(["moderators", "banned"], input.userlist)) error = errors.length - 1;
            break;
        // Editing list moderators
        case 22:
            if (input.userlist === "moderators") error = errors.length - 2;
            break;
        // Toggling possible toggleWork
        case 23:
            if(!_.contains(["confirmations", "reports", "done"], input.toggle)) error = errors.length - 1;
            break;
        // Class is approved
        case 24:
            if (!input.status) error = 18;
            break;
        // User is logged in
        case 25:
            if (Meteor.userId() === null) error = errors.length - 1;
            break;
        // New Teacher doesn't already exist
        case 26:
            if (teachers.find({name: input.teachername, school: input.school}).fetch().length > 0) error = 19;
            break;
        // Not banning admin
        case 27:
            if (Roles.userIsInRole(input.userId, ['superadmin', 'admin'])) error = errors.length - 2;
            break;
        // Incorrect teacher format
        case 28:
            if (input.teachername.split(" ").length < 2 && teachername !== "") error = 20;
            break;
        }
        results.push(error);
    }
    error = results.find(function(result){return result !== 0;});
    if (checklist[checklist.length - 1] && error !== undefined) {
        return error;
    } else if (results.find(function(result){return result === 0;}) === undefined) {
        return results[0];
    } else {
        return 0;
    }
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
        var security = securityCheck([1, true]);
        if (!security) {
            schools.insert({
                name: schoolname
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    // Deletes school
    'deleteSchool': function(schoolId) {
        var security = securityCheck([1, true]);
        if (!security) {
            schools.remove({
                _id: schoolId
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    // Class Functions
    'createClass': function(input) {
        classes.schema.validate(input);
        var security = securityCheck([2, 3, 4, true],
                                     input);
        if (!security) {
            input.status = Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']);
            input.admin = Meteor.userId();
            Meteor.call('genCode', input.privacy, function(error, result) {
                input.code = result;
                if (input.category != "class" && input.category != "club") {
                    input.category = "other";
                }
                input.subscribers = [];
                input.moderators = [];
                input.banned = [];
                classes.insert(input, function(err, result) {
                    Meteor.call('joinClass', [result, input.code]);
                });
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    'approveClass': function(classId) {
        var security = securityCheck([1, true]);
        if (!security) {
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
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    // For class admins to get code
    'getCode': function(classId) {
        var foundclass = classes.findOne({
            _id: classId
        });
        var security = securityCheck([5, true], foundclass);
        if (!security) {
            return (foundclass.code === '') ? "None" : foundclass.code;
        } else {
            throw new Meteor.Error(errors[security]);
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
        var security = securityCheck([1, [5, 8, 9, true], false],
                                     Object.assign({}, foundclass || {}, {userId: found._id}));
        if (!security) {
            classes.update({
                _id: classId
            }, {
                $set: {
                    admin: userId
                }
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },

    // Allows someone to manage the class
    'trackUserInClass': function(input) {
        var userId = input[0];
        var classId = input[1];
        var userlist = input[2];
        var foundclass = classes.findOne({
            _id: classId
        });
        var security = securityCheck([1, [[5, [13, 22, true], false], 9, 21, true], false],
                                     Object.assign({}, foundclass, {userlist: userlist}));
        if (!security) {
            if (_.contains(foundclass[userlist], userId)) {
                foundclass[userlist] = _.without(foundclass[userlist], userId);
            } else {
                foundclass[userlist] = foundclass[userlist].concat(userId);
            }
            classes.update({
                _id: classId
            }, {
                $set: foundclass
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },

    'deleteClass': function(classid) {
        var found = classes.findOne({
            _id: classid
        });
        var security = securityCheck([1, 5, false],
                                     found);
        if (!security) {
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
            throw new Meteor.Error(errors[security]);
        }
    },

    // Work Functions
    'createWork': function(input) {
        input.creator = Meteor.userId();
        if(input.description) input.description = input.description.trim();
        work.schema.validate(input);
        var found = classes.findOne({
            _id: input.class
        });
        var security = securityCheck([[[8, 9, true], 16, false], 10, 20, 11, 12, true],
                                     Object.assign({}, found || {}, input, {userId: Meteor.userId()}));
        if (!security) {
            input = Object.assign({}, input, {confirmations: [Meteor.userId()], reports: [], done: [], comments: []});
            work.insert(input);
        } else {
            throw new Meteor.Error(errors[security]);
        }

    },
    'editWork': function(change) {
        var currentwork = work.findOne({
            _id: change._id
        });
        var currentclass = classes.findOne({
            _id: currentwork.class
        });
        if(change.description) change.description = change.description.trim();
        var security = securityCheck([[1, 16, 13, 14, 5, false], 11, 12, 10, 20, true],
                                     Object.assign({}, currentclass || {}, currentwork, {description: change.description, name: change.name, dueDate: change.dueDate, type: change.type}));

        if (!security) {
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
            throw new Meteor.Error(errors[security]);
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
        var security = securityCheck([15, [16, [8, 9, true], false]],
                                     Object.assign({}, workobject, currentclass || {}, {userId: user, comment: comment}));
        if (!security) {
            var commentInfo = {
                "comment": comment,
                "user": user,
                "date": new Date()
            };
            var newchain = workobject.comments.concat(commentInfo);
            work.update({
                _id: input[1]
            }, {
                $set: {
                    comments: newchain
                }
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },

    'toggleWork': function(input) {
        var workobject = work.findOne({
            _id: input[0]
        });
        var currentclass = classes.findOne({
            _id: workobject.class
        });
        var security = securityCheck([[16, 9, false], 23, true],
                                     Object.assign({}, workobject, currentclass || {}, {userId: Meteor.userId(), toggle: input[1]}));
        if (!security) {
            var type = input[1];
            var index = workobject[type].indexOf(Meteor.userId());
            var cIndex = workobject["confirmations"].indexOf(Meteor.userId());
            var rIndex = workobject["reports"].indexOf(Meteor.userId());
            var dIndex = workobject["done"].indexOf(Meteor.userId());
            switch(type) {
                case "confirmations":
                    if(index === -1) { // User hasn't confirmed.
                        workobject[type] = workobject[type].concat(Meteor.userId());
                        if(rIndex !== -1) workobject["reports"].splice(rIndex, 1); 
                    } else { // Used has confirmed.
                        workobject[type].splice(index, 1);
                    }
                    break;
                case "reports":
                    if(index === -1) { // User hasn't reported.
                        workobject[type] = workobject[type].concat(Meteor.userId());
                        if(cIndex !== -1) workobject["confirmations"].splice(cIndex, 1);
                    } else { // Used has reported.
                        workobject[type].splice(index, 1);
                    }
                    break;
                case "done":
                    if(index === -1) { // User isn't done.
                        workobject[type] = workobject[type].concat(Meteor.userId());
                        if(cIndex === -1) workobject["confirmations"] = workobject["confirmations"].concat(Meteor.userId());
                    } else { // User is done
                        workobject[type].splice(index, 1);
                    }
                    break;
            }
            work.update({
                _id: input[0]
            }, {
                $set: workobject
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    'deleteWork': function(workId) {
        var currentwork = work.findOne({
            _id: workId
        });
        var currentclass = classes.findOne({
            _id: currentwork.class
        });
        var security = securityCheck([1, 16, 13, 14, 5, false],
                                     Object.assign({}, currentwork, currentclass || {}));
        if (!security) {
            work.remove({
                _id: workId
            });
        } else {
            throw new Meteor.Error(errors[security]);
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
            "preferences": change.preferences,
            "name": current.name,
            "complete": change.complete
        };

        if ((current.grade <= refyear || current.grade >= refyear + 4) && current.grade !== 0) {
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
            throw new Meteor.Error(errors[errors.length - 1]);
        }
    },
    'createProfile': function(userId) {
        var currentuser = Meteor.users.findOne({
            _id: userId
        });
        var current = currentuser.profile;
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
        var found = classes.findOne({
            _id: change
        });
        var security = securityCheck([17, [5, 24, false], 18, true],
                                     Object.assign({}, found, {userId: Meteor.userId(), pass: pass}));
        if (!security) {
            var foundsubs = found.subscribers;
            classes.update({
                _id: found._id
            }, {
                $set: {
                    subscribers: foundsubs.concat(Meteor.userId())
                }
            });
            var current = Meteor.users.findOne({_id: Meteor.userId()}).profile;
            current.classes.push(change);
            Meteor.users.update({
                _id: Meteor.userId()
            }, {
                $set: {
                    profile: current
                }
            });
            return true;
        } else {
            throw new Meteor.Error(errors[security]);
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
            throw new Meteor.Error(errors[14]);
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
                } else {
                    throw new Meteor.Error("unauthorized", "You are currently the admin of this class. Transfer ownership in order to leave this class.");
                }
            }

        } else {
            throw new Meteor.Error(errors[errors.length - 1]);
        }
    },

    // Admin Functions
    'createAdmin': function(userId) {
        var security = securityCheck([-1, true]);
        if (!security) {
            Roles.addUsersToRoles(userId, ['admin']);
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    'deleteAdmin': function(userId) {
        var security = securityCheck([-1, true]);
        if (!security) {
            Roles.removeUsersToRoles(userId, ['admin']);
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    'createRequest': function(request) {
        var security = securityCheck([19, 25, true],
                                     request);
        if (!security) {
            requests.insert({
                requestor: Meteor.userId(),
                request: request.content,
                info: request.info,
                timeRequested: new Date()
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    'deleteRequest': function(requestId) {
        var security = securityCheck([1, true]);
        if (!security) {
            requests.remove({
                _id: requestId
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    'createTeacher': function(teacherName, schoolName) {
        teachers.schema.validate({name: teacherName, school: schoolName});
        var security = securityCheck([26, 28, 3, true], {teachername: teacherName, school: schoolName});
        if (!security) {
            teachers.insert({
                name: teacherName,
                school: schoolName,
                creator: Meteor.userId()
            });
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    'ban': function(studentId) {
        var security = securityCheck([1, 27, true], {userId: studentId});
        if (!security) {
            Meteor.users.update({_id: studentId}, {$set: {banned: true}});
        } else {
            throw new Meteor.Error(errors[security]);
        }
    },
    'unban': function(studentId) {
        var security = securityCheck([1, true], {userId: studentId});
        if (!security) {
            Meteor.users.update({_id: studentId}, {$set: {banned: false}});
        } else {
            throw new Meteor.Error(errors[security]);
        }
    }
});
