import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var openValues = {
	"menu": "-25%",
	"options": "-20%"
};

var themeColors = {
	"light": {
		"header":"#EBEBEB",
		"statusIcons":"#33ADFF",
		"sidebar":"tbd",
		"highlightText":"#FF1A1A"
	},
	"dark": {

	}
}

Session.set("menuOpen", false);
Session.set("optionsOpen", false);
Session.set("mode",null); // Change to user preferences
Session.set("function", null);

Cookie.set("theme","light",{'years':15});

Template.header.helpers({
	headerColor() {
		return themeColors[Cookie.get("theme")].header;
	},
	menuIconColor() {
		let status = Session.get("menuOpen");
		if(status) {
			return themeColors[Cookie.get("theme")].statusIcons;
		} else {
			return;
		}
	},
	optionsIconColor() {
		let status = Session.get("optionsOpen");
		if(status) {
			return themeColors[Cookie.get("theme")].statusIcons;
		} else {
			return;
		}
	}
});

Template.menu.helpers({
	menuStatus() {
  		let status = Session.get("menuOpen");
	  	if(status) {
	  		return "0%";
	  	} else {
	  		return openValues["menu"];
	  	}
	},
	claStatus() {
		let status = Session.get("mode");
		if(status === "classes") {
			return themeColors[Cookie.get("theme")].highlightText;
		} else {
			return;
		}
	},
	calStatus() {
		let status = Session.get("mode");
		if(status === "calendar") {
			return themeColors[Cookie.get("theme")].highlightText;
		} else {
			return;
		}
	},
	addStatus() {
		let status = Session.get("function");
		if(status === "addClass") {
			return themeColors[Cookie.get("theme")].highlightText;
		} else {
			return;
		}
	},
	delStatus() {
		let status = Session.get("function");
		if(status === "delClass") {
			return themeColors[Cookie.get("theme")].highlightText;
		} else {
			return;
		}
	},
	manStatus() {
		let status = Session.get("function");
		if(status === "manClass") {
			return themeColors[Cookie.get("theme")].highlightText;
		} else {
			return;
		}
	}
});

Template.options.helpers({
	optionsStatus() {
	  	let status = Session.get("optionsOpen");
	  	if(status) {
	  		return "0%";
	  	} else {
	  		return openValues["options"];
	  	}
	}
});

Template.header.events({
	'click .fa-bars' () {
		Session.set("menuOpen",!Session.get("menuOpen"));
	},
	'click .fa-cog' () {
		Session.set("optionsOpen",!Session.get("optionsOpen"));
	}
})

Template.menu.events({
	'click .classes' () {
		Session.set("mode","classes");
	},
	'click .calendar' () {
		Session.set("mode","calendar");
	},
	'click .addClass' () {
		Session.set("function","addClass");
	},
	'click .deleteClass' () {
		Session.set("function","delClass");
	},
	'click .manageClass' () {
		Session.set("function","manClass");
	}
})
