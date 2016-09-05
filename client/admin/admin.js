Session.set("adminTab","aClasses");

Template.admin.helpers({
	banner() {
		if(Meteor.user() === null || Meteor.user() === undefined) return;
		var w = window.innerWidth;
		var h = window.innerHeight * 0.3;
		return "width:" + w + "px;height:" + h + "px;background-image:url(\'" + Meteor.user().profile.banner + "\');background-size:" + w+"px";
	},
	filters() {
		return [{filter:"Lol"}];
	},
	adminTab(val) {
		return Session.equals("adminTab",val);
	},
	collection(val) {
		switch(val) {
			case "classes":
				var classes = classes.find().fetch();
				for(var i = 0; i < classes.length; i++) {
					
				}
				break;
			case "users":
				break;
			case "work":
				break;
			case "schools":
				break;
			case "requests":
				break;
		}
	}
});

Template.admin.events({
	'click #adminTabs li' (event) {
		var id = event.target.id;
		document.getElementById(Session.get("adminTab")).style.backgroundColor = themeColors[Meteor.user().profile.preferences.theme].adminButtons;
		Session.set("adminTab",id);
		document.getElementById(id).style.backgroundColor = themeColors[Meteor.user().profile.preferences.theme].header;
		
	}
})