import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

schools = new Mongo.Collection("Schools");
classes = new Mongo.Collection("Classes");
homework = new Mongo.Collection("Homework");

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
	moderators: {type: [String]},
	banned: {type: [String]},
	blockEdit: {type: [String]},
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

// Meteor.methods({
// 	createClass: function(client) {
// 		if 
// 	}

// });

Meteor.startup(() => {
  Meteor.methods({

  })
});