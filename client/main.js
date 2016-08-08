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
Session.set("confirm",null);

Cookie.set("theme","light",{'years':15});

Template.main.helpers({
	divColor(div) {
		return themeColors[Cookie.get("theme")][div];	
	},
	iconColor(icon) {
		let status = Session.get(icon+"Open");
		if(status) {
			return themeColors[Cookie.get("theme")].statusIcons;
		} else {
			return;
		}
	},
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
	},
	optionsStatus() {
	  	let status = Session.get("optionsOpen");
	  	if(status) {
	  		return "0%";
	  	} else {
	  		return openValues["options"];
	  	}
	},
	opacity() {
		if(Session.get("function") !== null) {
			setTimeout(function() {
				return "1";
			}, 300)
		} else {
			return "0"
		}
	}
});

Template.main.events({
	'click .fa-bars' () {
		Session.set("menuOpen",!Session.get("menuOpen"));
	},
	'click .fa-cog' () {
		Session.set("optionsOpen",!Session.get("optionsOpen"));
	},
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
	},
	'keyup .creInput' () {
		//Display and search
	},
	'click .creSubmit' () {
		confirmOverlay();
		setTimeout(function() {
			document.getElementsByClassName("overlay")[0].style.opacity = "1";
		}, 200);
		Session.set("confirm","createClass");
	},
	'click .fa-check-circle-o' () {
		sendData();
		closeOverlay();
		Session.set("confirm",null);
		Session.set("function",null);
		document.getElementsByClassName("create")[0].reset();
	},
	'click .fa-times-circle-o' () {
		closeOverlay();
		Session.set("confirm",null);
		Session.set("function",null);
		document.getElementsByClassName("create")[0].reset();
	}
})

function closeOverlay() {
	var overlay = document.getElementsByClassName("overlay")[0]
	overlay.style.opacity = "0";
	setTimeout(function() {
		document.getElementsByTagName("html")[0].removeChild(overlay);
	})
}

function confirmOverlay() {
	var overlay = document.createElement("div");
	overlay.className = "overlay";

	var overlayCont = document.createElement("div");
	overlayCont.className = "overlayCont";
	overlayCont.style.position = "absolute";
	overlayCont.style.top = "30%";
	overlayCont.style.left = "50%";
	overlayCont.style.backgroundColor = themeColors[Cookie.get("theme")]["header"]

	var dim = [window.innerWidth * .2,window.innerHeight * .2]
	overlayCont.style.width = dim[0].toString() + "px";
	overlayCont.style.height = dim[1].toString() + "px";
	overlayCont.style.marginLeft = -(dim[0]/2).toString() + "px";
	overlayCont.style.marginTop = -(dim[1]/2).toString() + "px";
	overlay.appendChild(overlayCont);

	var desc = document.createElement("p");
	desc.className = "overlayText";
	desc.appendChild(document.createTextNode("Are you sure?"));

	var yes = document.createElement("i");
	yes.className = "fa fa-check-circle-o";
	yes.setAttribute("aria-hidden",true);

	var no = document.createElement("i");
	no.className = "fa fa-times-circle-o";
	no.setAttribute("aria-hidden",true);

	overlayCont.appendChild(desc);
	overlayCont.appendChild(yes);
	overlayCont.appendChild(no);
	document.getElementsByTagName("html")[0].appendChild(overlay);
}

function sendData() {
	// Take form data
}
