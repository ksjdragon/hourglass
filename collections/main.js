schools = new Mongo.Collection("Schools");
teachers = new Mongo.Collection("Teachers");
classes = new Mongo.Collection("Classes");
work = new Mongo.Collection("Work");
requests = new Mongo.Collection("Requests");
admins = Meteor.users;

schools.schema = new SimpleSchema({
	  name: {type: String}
});

teachers.schema = new SimpleSchema({
	  name: {type: String},
	  school: {type: String},
    creator: {type: String, optional: true}

});

classes.schema = new SimpleSchema({
	  school: {type: String},
	  //icon: {type: String},
	  name: {type: String, label: "Class Name"},
	  hour: {type: String, optional: true},
	  teacher: {type: String, optional: true},
	  admin: {type: String, optional: true},
	  status: {type: Boolean, defaultValue: false},
	  code: {type: String, optional: true},
	  privacy: {type: Boolean},
	  category: {type: String},
	  moderators: {type: [String], optional: true},
	  banned: {type: [String], optional: true},
	  subscribers: {type: [String], optional: true}
});

work.schema = new SimpleSchema({
	  name: {type: String},
	  class: {type: String},
	  dueDate: {type: Date},
	  description: {type: String, optional: true},
	  creator: {type: String},
	  comments: {type: [Object], blackbox: true, optional: true},
	  confirmations: {type: [String], optional: true},
	  reports: {type: [String], optional: true},
	  attachments: {type: [String], optional: true},
	  done: {type: [String], optional: true},
	  type: {type: String}
});

requests.schema = new SimpleSchema({
    requestor: {type: String},
    request: {type: String},
    timeRequested: {type: Date},
    'info.users': {type: [Object], label: "Debug Users"},
    'info.userInfo': {type: Object, label: "Debug User Info"},
    'info.userClasses': {type: [Object], label: "Debug User Classes"}
});

userSchema = new SimpleSchema({
	'profile.name': {type: String, label: "Name"},
	'profile.grade': {type: Number, label: "Graduation Year"},
	'profile.school': {type: String, label: "School"},
	'services.google.email': {type: String, label: "Email"},
	'services.google.picture': {type: String, label: "Icon URL"},
	'profile.classes': {type: [String], label: "Classes"}
});

teachers.schema = new SimpleSchema({
    name: {type: String},
    school: {type: String}
});

schools.attachSchema(schools.schema);
teachers.attachSchema(teachers.schema);
classes.attachSchema(classes.schema);
work.attachSchema(work.schema);
requests.attachSchema(requests.schema);
teachers.attachSchema(teachers.schema);
