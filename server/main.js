import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

_uuid4 = function(cc) {
    var rr = Math.random() * 16 | 0; 
    return (cc === 'x' ? rr : (rr & 0x3 | 0x8)).toString(16);
}

Meteor.startup(() => {
	Meteor.methods({
		'genCode': function() {
	        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, _uuid4);
		},
		'createClass': function(input) {
			if(Meteor.user() != null && Meteor.classes.find({status:true, admin:Meteor.userId()}).length < 5){
				classes.schema.validate(input);
				classes.insert(input);
			}
		},
    'editProfile': function(profile) {
      // profile.name = this.user
    }
  	})
});