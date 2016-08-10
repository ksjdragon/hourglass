import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

_uuid4 = function(cc) {
    var rr = Math.random() * 16 | 0; 
    return (cc === 'x' ? rr : (rr & 0x3 | 0x8)).toString(16);
}

Meteor.methods({
	'genCode': function() {
    return 'xxxxxx'.replace(/[x]/g, _uuid4);
	},
  'createSchool': function(schoolname) {
    if (Meteor.user() != null && schools.find({name:input.school}).fetch().length === 0) {
      schools.insert({name: schoolname, status: false});
    }
  },
	'createClass': function(input) {
		classes.schema.validate(input);
    if(Meteor.user() != null && classes.find({status:false, admin:Meteor.userId()}).fetch().length < 5 &&
      schools.find({name:input.school}).fetch().length > 0 && input.status === false) {
      
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
      Meteor.call('joinClass',classes.find({input}).fetch()[0]._id, input.code, function(error,result){});
      return 1;
		} else {
      return 0;
    }
	},
  'editProfile': function(change) {
    current = Meteor.user().profile;
    current.school = change[0];
    current.grade = change[1];
    current.description = change[2];
    current.avatar = change[3];
    current.banner = change[4];
    if (schools.find({name:current.school}).fetch().length > 0 && Number.isInteger(current.grade) &&
    current.grade >= 9 && current.grade <= 12 && current.description.length < 100) {
      Meteor.users.update({_id: Meteor.userId()}, {$set: {profile: current}});
      return 1;
    } else {
      return 0;
    }
  },
  'joinClass': function(change, pass) {
    found = classes.find({_id: change, status: true}).fetch();
    if (Meteor.user() != null && found.length > 0 && pass === found[0].code && Meteor.user().profile.classes.indexOf(change) === -1) {
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
        if (classes.find({_id: change}).fetch()[0].admin != Meteor.userId()) {
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