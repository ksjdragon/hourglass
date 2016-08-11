import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

_uuid4 = function(cc) {
    var rr = Math.random() * 16 | 0; 
    return (cc === 'x' ? rr : (rr & 0x3 | 0x8)).toString(16);
}

worktype = ["test", "quiz", "project", "normal"];
Meteor.methods({
	'genCode': function() {
    return 'xxxxxx'.replace(/[x]/g, _uuid4);
	},
  'createSchool': function(schoolname) {
    // if superadmin, no need for approval
    if (Meteor.user() != null && schools.findOne({name:input.school}) != null && 
      schools.findOne({status: false, creator: Meteor.userId()}) != null) {

      schools.insert({name: schoolname, status: false, creator: Meteor.userId()});
    }
  },
  'deleteSchool': function(schoolid) {
    // alanning:roles implementation here
    schools.remove({_id: schoolid})
  },
	'createClass': function(input) {
    // if superadmin, no need for approval
		classes.schema.validate(input);
    if(Meteor.user() != null && classes.find({status:false, admin:Meteor.userId()}).fetch().length < 5 &&
      schools.findOne({name:input.school}) != null) {
      input.status = false;
      input.subscribers = 0;
      input.admin = Meteor.userId()
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
      input.moderators = []
      input.banned = []
      input.blockEdit = []
			classes.insert(input);
      Meteor.call('joinClass',classes.findOne(input)._id, input.code, function(error,result){});
      return 1;
		} else {
      return 0;
    }
	},
  'deleteClass': function(classid) {
    found = classes.findOne({_id: classid});
    // Add roles
    if (Meteor.user() != null && found != null && found.admin === Meteor.user()._id) {
      classes.remove({_id: classid})
    }
  },
  'createWork': function(input) {
    ref = new Date()
    month = ref.getMonth +1
    ref = new Date(ref.getFullYear()+ "-" + month.toString() + "-" + ref.getDate()).getTime()
    work.schema.validate(input);
    found = Meteor.findOne({_id: input.class})
    if (Meteor.user() != null && found != null && found.subscribers.indexOf(Meteor.userId()) != -1
      && found.banned.indexOf(Meteor.userId()) === -1 && found.blockEdit.indexOf(Meteor.userId()) === -1
      && input.dueDate.getTime() >= ref && worktype.indexOf(type) != -1 && input.name.length <= 50) {
      input.submittor = Meteor.userId();
      input.confirmations = [Meteor.userId()];
      input.reports = [];
      input.done = [];
      input.numberdone = 0;
      work.insert(input);
    }

  },
  'deleteWork': function(workid) {
    // Add security here
    work.remove({_id: workid});
  },
  'editProfile': function(change) {
    current = Meteor.user().profile;
    current.school = change[0];
    current.grade = change[1];
    current.description = change[2];
    current.avatar = change[3];
    current.banner = change[4];
    if (schools.findOne({name:current.school}) != null && Number.isInteger(current.grade) &&
    current.grade >= 9 && current.grade <= 12 && current.description.length <= 100) {
      Meteor.users.update({_id: Meteor.userId()}, {$set: {profile: current}});
      return 1;
    } else {
      return 0;
    }
  },
  'joinClass': function(change, pass) {
    found = classes.findOne({_id: change, status: true});
    if (Meteor.user() != null && found != null && pass === found.code 
      && found.banned.indexOf(Meteor.userId()) === -1 && Meteor.user().profile.classes.indexOf(change) === -1) {
      current = Meteor.user().profile;
      current.classes.append(change);
      Meteor.users.update({_id: Meteor.userId()}, {$set: {profile: current}});
      return 1;
    } else {
      return 0;
    }
  },
  'leaveClass': function(change) {
    if (Meteor.user() != null) {
      profile = Meteor.user().profile
      index = profile.classes.indexOf(change)
      if (index >= 0) {
        if (classes.findOne({_id: change}).admin != Meteor.userId()) {
          profile.classes.splice(index, 1);
          Meteor.users.update({_id: Meteor.userId()}, {$set: {profile: current}});
          return 1
        } else {
          throw "You are currently the admin of this class. Transfer ownership in order to leave this class."
        }
      }

    }
  }
});