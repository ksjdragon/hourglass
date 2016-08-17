schools = new Mongo.Collection("Schools");
classes = new Mongo.Collection("Classes");
work = new Mongo.Collection("Work");

schools.schema = new SimpleSchema({
	  name: {type: String},
	  status: {type: Boolean},
	  creator: {type: String},
});

classes.schema = new SimpleSchema({
	  school: {type: String},
	  //icon: {type: String},
	  name: {type: String, label: "Class Name"},
	  hour: {type: String, optional: true},
	  teacher: {type: String, optional: true},
	  admin: {type: String, optional: true},
	  status: {type: Boolean, defaultValue: false},
	  code: {type: String, defaultValue: ""},
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
	  comments: {type: [String], optional: true},
	  confirmations: {type: [String], optional: true},
	  reports: {type: [String], optional: true},
	  attachments: {type: [String], optional: true},
	  done: {type: [String], optional: true},
	  type: {type: String}
});
