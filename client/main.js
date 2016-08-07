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
		"sidebar":"#65839A",
		"statusIcons":"#33ADFF",
		"highlightText":"#FF1A1A"
	},
	"dark": {

	}
};

Session.set("menuOpen", false);
Session.set("optionsOpen", false);
Session.set("mode",null); // Change to user preferences
Session.set("function", null);

Cookie.set("theme","light",{'years':15});

Template.registerHelper('divColor', (div) => {
	return themeColors[Cookie.get("theme")][div];	
	
});

Template.header.helpers({
	iconColor(icon) {
		let status = Session.get(icon+"Open");
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
	modeStatus(status) {
		if(status === Session.get("mode")) {
			return themeColors[Cookie.get("theme")].highlightText;
		} else {
			return;
		}
	},
	functionStatus(status) {
		if(status === Session.get("function")) {
			return themeColors[Cookie.get("theme")].highlightText;
		} else {
			return;
		}
	},
	currFunction(name) {
		if(name === Session.get("function")) {
			return true;
		} else {
			return false;
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
	'click .manageClass' () {
		Session.set("function","manClass");
	},
	'click .createClass' () {
		Session.set("function","creClass");
	}
})
