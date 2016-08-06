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
		"sidebar":"tbd"
	},
	"dark": {

	}
}

Session.set("menuOpen", false);
Session.set("optionsOpen", false);

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
