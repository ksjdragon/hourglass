import {
    Meteor
} from 'meteor/meteor';
import {
    Mongo
} from 'meteor/mongo';

_uuid4 = function(cc) {
    var rr = Math.random() * 16 | 0;
    return (cc === 'x' ? rr : (rr & 0x3 | 0x8)).toString(16);
};

superadmins = [
    "ybq987@gmail.com",
    "ksjdragon@gmail.com"
];

worktype = ["test", "quiz", "project", "normal"];

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
        return classes.find({
            $or: [{
                privacy: false
            }, {
                _id: {
                    $in: this.user().profile.classes
                }
            }]
        }, {
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
                blockEdit: 1,
                subscribers: 1
            }
        });
    }
});

Meteor.publish('work', function() {
    if (Roles.userIsInRole(this.userId, ['superadmin', 'admin'])) {
        return work.find();
    } else {
        return work.find({
            class: {
                $in: this.user().profile.classes
            }
        });
    }

});

Meteor.methods({
    'genCode': function() {
        return 'xxxxxx'.replace(/[x]/g, _uuid4);
    },
    'createSchool': function(schoolname) {
        if (Meteor.user() !== null &&
            schools.findOne({
                name: input.school
            }) !== null &&
            schools.findOne({
                status: false,
                creator: Meteor.userId()
            }) !== null) {

            if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
                var stat = true;
            } else {
                var stat = false;
            }
            schools.insert({
                name: schoolname,
                status: stat,
                creator: Meteor.userId()
            });
        }
    },
    'deleteSchool': function(schoolId) {
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            schools.remove({
                _id: schoolId
            });
        }
    },
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
            input.subscribers = 0;
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
            input.blockEdit = [];
            classes.insert(input);
            Meteor.call('joinClass', classes.findOne(input)._id, input.code, function(error, result) {});
            return 1;
        } else {
            return 0;
        }
    },
    'deleteClass': function(classid) {
        var found = classes.findOne({
            _id: classid
        });
        if (Meteor.user() !== null && found !== null && (found.admin === Meteor.user()._id || Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']))) {
            classes.remove({
                _id: classid
            });
        }
    },
    'createWork': function(input) {
        var ref = new Date();
        var month = ref.getMonth + 1;
        ref = new Date(ref.getFullYear() + "-" + month.toString() + "-" + ref.getDate()).getTime();
        input.creator = Meteor.userId();
        work.schema.validate(input);
        var found = Meteor.findOne({
            _id: input.class
        });

        if (Meteor.user() !== null &&
            found !== null &&
            found.subscribers.indexOf(Meteor.userId()) != -1 &&
            found.banned.indexOf(Meteor.userId()) === -1 &&
            found.blockEdit.indexOf(Meteor.userId()) === -1 &&
            input.dueDate.getTime() >= ref && worktype.indexOf(type) != -1 &&
            input.name.length <= 50) {

            input.confirmations = [Meteor.userId()];
            input.reports = [];
            input.done = [];
            input.numberdone = 0;
            input.comments = [];
            work.insert(input);
        }

    },
    'editWork': function(change) {
        var ref = new Date();
        var month = ref.getMonth + 1;
        ref = new Date(ref.getFullYear() + "-" + month.toString() + "-" + ref.getDate()).getTime();

        var currentclass = classes.findOne({_id: work.findOne({_id: workId}).class});
        var authorized = currentclass.moderators.push(currentclass.admin);
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin'])) {
            Meteor.update({_id: change._id}, {$set: change});
        } else if (authorized.indexOf(Meteor.userId()) != -1) {
            if (change.name.length <= 50 && worktype.indexOf(type) != -1) {
                Meteor.update({_id: change._id}, {$set: {name: change.name, dueDate: change.dueDate, comments: change.comments, attachments: change.attachments, type: change.type}});
            }
        } else if (Meteor.userId() === work.findOne({_id: change._id}).creator) {
            if (change.name.length <= 50 && worktype.indexOf(type) != -1 && input.dueDate.getTime() >= ref) {
                Meteor.update({_id: change._id}, {$set: {name: change.name, dueDate: change.dueDate, attachments: change.attachments, type: change.type}});
            }
        } else {
            throw "Unauthorized."
        }
    },
    'addComment': function(input) {
        var comment = input[0];
        var workobject = work.findOne({_id: input[1]});
        var currentclass = classes.findOne({_id: workobject.class});
        if (typeof comment === "string" && comment.length <= 200 &&
            currentclass.subscribers.indexOf(Meteor.userId()) != -1 &&
            currentclass.blockEdit.indexOf(Meteor.userId()) === -1) {
            var comments = workobject.comments.push(comment);
            work.update({_id: input[1]}, {$set: {comments: comments}});
        }
    },
    'markWork': function(input) {
        var workobject = work.findOne({_id: input[0]});
        var currentclass = classes.findOne({_id: workobject.class});
        if (currentclass.subscribers.indexOf(Meteor.userId()) != -1 &&
            ["confirmations", "reports", "done"].indexOf(input[1]) != -1 &&
            workobject[input[1]].indexOf(Meteor.userId()) === -1) {
            workobject[input[1]] = workobject[input[1]].push(Meteor.userId());
            work.update({_id: input[1]}, {$set: workobject});
        }
    },
    'deleteWork': function(workId) {
        var currentclass = classes.findOne({_id: work.findOne({_id: workId}).class});
        var authorized = currentclass.moderators.push(currentclass.admin);
        if (Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            authorized.indexOf(Meteor.userId()) != -1) {

            work.remove({
                _id: workId
            });
        }
    },
    'editProfile': function(change) {
        var current = Meteor.user().profile;
        current.school = change.school;
        current.grade = change.grade;
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
            return 1;
        } else {
            return 0;
        }
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
            found.banned.indexOf(Meteor.userId()) === -1 &&
            prof.classes.indexOf(change) === -1) {

            var current = Meteor.user().profile;
            current.classes.push(change);
            Meteor.users.update({
                _id: Meteor.userId()
            }, {
                $set: {
                    profile: current
                }
            });
            return 1;
        } else {
            return 0;
        }
    },
    'leaveClass': function(change) {
        if (Meteor.user() !== null) {
            var profile = Meteor.user().profile;
            var index = profile.classes.indexOf(change);
            if (index >= 0) {
                if (classes.findOne({
                    _id: change
                }).admin != Meteor.userId()) {
                    profile.classes.splice(index, 1);
                    Meteor.users.update({
                        _id: Meteor.userId()
                    }, {
                        $set: {
                            profile: current
                        }
                    });
                    return 1;
                } else {
                    throw "You are currently the admin of this class. Transfer ownership in order to leave this class.";
                }
            }

        }
    },
    'createAdmin': function(userId) {
        if (Roles.userIsInRole(Meteor.user()._id, ['superadmin'])) {
            Roles.addUsersToRoles(userId, ['admin']);
        }
    },
    'deleteAdmin': function(userId) {
        if (Roles.userIsInRole(Meteor.user()._id, ['superadmin'])) {
            Roles.removeUsersToRoles(userId, ['admin']);
        }
    }
});

function has(array, has) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === has) return true;
    }
    return false;
}
