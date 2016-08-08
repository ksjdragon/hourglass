import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

schools = new Mongo.Collection("Schools");
classes = new Mongo.Collection("Classes");
work = new Mongo.Collection("Work");

schools.schema = new SimpleSchema({
	name: {type: String},
	aliases: {type: [String]}
});

classes.schema = new SimpleSchema({
	school: {type: String},
	//icon: {type: String},
	name: {type: String, label: "Class Name"},
	hour: {type: String, optional: true},
	teacher: {type: String, optional: true},
	status: {type: Boolean, defaultValue: false},
	code: {type: String, optional: true},
	privacy: {type: String},
	category: {type: String},
	moderators: {type: [String], optional: true},
	banned: {type: [String], optional: true},
	blockEdit: {type: [String], optional: true},
	admin: {type: String}
});

work.schema = new SimpleSchema({
	class: {type: String},
	dueDate: {type: Date},
	aliases: {type: [String]},
	submittor: {type: String},
	confirmations: {type: [String]},
	reports: {type: [String], optional: true},
	attachments: {type: [String], optional: true},
	done: {type: [String], optional: true}
});

function allow(user, method) {
	//Switch/case for different permissions per method/function
}

var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

Meteor.startup(() => {
	Meteor.methods({
		'genCode': function() {
			var text = "";
			var same = true;
			while(same) {
				for(var i = 0; i < 6; i++) {
        			text += possible.charAt(Math.floor(Math.random() * 52));
				}
				if(!classes.find( { code: { $eq: text } } ).limit(1)) {
					same = false;
				}
			}
        	return text;
		},
  		'createClass': function(input) {
  			if(allow(Meteor.userId(),"createClass")) {
  				classes.schema.validate(input);
  				classes.insert(input);
  			}
  		}
  	})
});