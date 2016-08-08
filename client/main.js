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
	overlayDim(part) {
		var dim = [window.innerWidth * .2,window.innerHeight * .2];
		var width = "width:"+dim[0].toString() + "px;";
		var height = "height:"+dim[1].toString() + "px;";
		var margin = "margin:"+(-dim[0]/2).toString() + "px 0 0 " + -(dim[1]/2).toString() + "px;";
		var bg = "background-color:"+themeColors[Cookie.get("theme")]["header"]+";";
		return width+height+margin+bg;
	}
});

;
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
		var functionHolder = document.getElementById("functionHolder")
		closeDivFade(functionHolder);
		setTimeout(function() {
			Session.set("function","addClass");
			openDivFade(functionHolder);
		},300);
	},
	'click .manageClass' () {
		var functionHolder = document.getElementById("functionHolder")
		closeDivFade(functionHolder);
		setTimeout(function() {
			Session.set("function","manClass");
			openDivFade(functionHolder);
		},300);
	},
	'click .createClass' () {
		var functionHolder = document.getElementById("functionHolder")
		closeDivFade(functionHolder);
		setTimeout(function() {
			Session.set("function","creClass");
			openDivFade(functionHolder);
		},300);
	},
	'keyup .creInput' () {
		//Display and search
	},
	'click .creSubmit' () {
		openDivFade(document.getElementsByClassName("overlay")[0]);
		setTimeout(function() {
			document.getElementsByClassName("overlay")[0].style.opacity = "1";
		}, 200);
		Session.set("confirm","createClass");
	},
	'click .fa-check-circle-o' () {
		sendData();
		closeDivFade(document.getElementsByClassName("overlay")[0]);
		closeDivFade(document.getElementById("functionHolder"));
		document.getElementById("create").reset();
		setTimeout(function() {
			Session.set("confirm",null);
			Session.set("function",null);
		}, 300);
	},
	'click .fa-times-circle-o' () {
		closeDivFade(document.getElementsByClassName("overlay")[0]);
		closeDivFade(document.getElementById("functionHolder"));
		document.getElementById("create").reset();
		setTimeout(function() {
			Session.set("confirm",null);
			Session.set("function",null);
		}, 300);
	}
})

function openDivFade(div) {
	div.style.display = "block";
	div.style.opacity = "0";
	setTimeout(function() {
		div.style.opacity = "1";
	}, 300);
}

function closeDivFade(div) {
	div.style.opacity = "0";
	setTimeout(function() {
		div.style.display = "none";
	}, 300);
}

function sendData() {
	// Take form data
}
