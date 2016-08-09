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
  //No Security
	'createClass': function(input) {
    var distinctEntries = _.uniq(classes.find({}, {
    sort: {teacher: 1}, fields: {teacher: true}
    }).fetch().map(function(x) {
        return x.teacher;
    }), true);
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
      Meteor.call('joinClass',input.name, input.code, function(error,result){});
      return 1;
		} else {
      return 0;
    }
	},
  'editProfile': function(change) {
    current = Meteor.user().profile;
    current.school = change[0];
    current.grade = change[1];
    if (schools.find({name:current.school}).fetch().length > 0 && Number.isInteger(current.grade) &&
    current.grade >= 9 && current.grade <= 12) {
      Meteor.users.update({_id: Meteor.userId()}, {$set: {profile: current}});
      return 1;
    } else {
      return 0;
    }
  },
  'joinClass': function(change, pass) {
    found = classes.find({name: change, status: true}).fetch();
    if (Meteor.user() != null && found.length > 0 && pass === found[0].code) {
      current = Meteor.user().profile;
      current.classes.append(change);
      Meteor.users.update({_id: Meteor.userId()}, {$set: {profile: current}});
      return 1;
    } else {
      return 0;
    }
  }
});