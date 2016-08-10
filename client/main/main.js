import { Template } from 'meteor/templating';

import './main.html';

var openValues = {
	"menu": "-25%",
	"options": "-20%"
};

var themeColors = {
	"light": {
		"background":"White.jpg",
		"header":"#EBEBEB",
		"sidebar":"#65839A",
		"statusIcons":"#33ADFF",
		"highlightText":"#FF1A1A",
		"cards":"#FEFEFE"
	},
	"dark": {

	}
};
var calendarColors = {
	"test": "red",
	"project": "blue",
	"normal": "green",
	"quiz": "black"
}
var options = {
	"privacy": ["Public", "Hidden"],
	"category": ["Class", "Club", "Other"]
}

var searchSchools = [];

Session.set("menuOpen", false);
Session.set("optionsOpen", false);
Session.set("mode",null); // Change to user preferences
Session.set("function", null);
Session.set("confirm",null);
Session.set("formCre",null);
Session.set("inputOpen",null);

Template.registerHelper( 'divColor', (div) => {
	return themeColors[Cookie.get("theme")][div];	
})

Template.main.helpers({
	schoolname() {
		return " - " + Meteor.user().profile.school;
	},
	iconColor(icon) {
		let status = Session.get(icon+"Open");
		if(status) {
			return themeColors[Cookie.get("theme")].statusIcons;
		} else {
			return;
		}
	},
	bgSrc() {
		var dim = [window.innerWidth,window.innerHeight];
		var pic = themeColors[Cookie.get("theme")].background;
		return pic;
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
	currMode(name) {
		if(name === Session.get("mode")) {
			return true;
		} else {
			return false;
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
	},
	creHighlight(input) {
		if(input == Session.get("creInput")) {
			return "#CCEEFF";
		} else {
			return;
		}
	},
	schoolcomplete() {
		return {
		  position: "bottom",
		  limit: 6,
		  rules: [
		    {
		      token: '',
		      collection: schools,
		      field: 'name',
		      matchAll: true,
		      template: Template.schoollist
		    }
		  ]
		};
	},
	teachercomplete() {
		return {
		  position: "bottom",
		  limit: 1,
		  rules: [
		    {
		      token: '',
		      collection: classes,
		      field: 'teacher',
		      template: Template.teacherlist
		    }
		  ]
		};
	},
	calendarOptions() {
		return {
			height: window.innerHeight *.8,
			events: function() {
				var cursor = work.find({});
				var donelist = [];
				cursor.forEach(function(current) {
					backgroundColor = calendarColors[current.type];
					title = current.name;
					duedate = current.date.toISOString().slice(0,10);
					donelist.push({start: duedate, title: title, backgroundColor: backgroundColor});			    
				});
				return donelist;
			}
		};
	},
	calCenter() {
		var width = window.innerWidth * .85;
		return "width:"+width.toString()+"px;margin-left:"+(.5*window.innerWidth-.5*width).toString()+"px"; 
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
		var modeHolder = document.getElementById("mainBody");
		closeDivFade(modeHolder);
		setTimeout(function() {
			Session.set("mode","classes");
			openDivFade(modeHolder);
		}, 300);
		
	},
	'click .calendar' () {
		var modeHolder = document.getElementById("mainBody");
		closeDivFade(modeHolder);
		setTimeout(function() {
			Session.set("mode","calendar");
			openDivFade(modeHolder);
		}, 300);
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
	},
	'click .creInput' (event) {
		var opened = Session.get("inputOpen");
		if(opened !== null && opened !== event.target.getAttribute("op")) {
			closeDivFade(document.getElementsByClassName("creInputSel")[opened].parentNode.childNodes[4]);
		}
	},
	'click .creInputSel' (event) {
		Session.set("inputOpen", event.target.getAttribute("op"));
		openDivFade(event.target.parentNode.childNodes[4]);
	},
	'focus .creInputSel' (event) {
		Session.set("inputOpen", event.target.getAttribute("op"));
		openDivFade(event.target.parentNode.childNodes[4]);
	},
	'click .creOptions p' (event) {
		var p = event.target;
		p.parentNode.parentNode.childNodes[1].value = p.childNodes[0].nodeValue;
		closeDivFade(p.parentNode);
		p.parentNode.parentNode.childNodes[1].focus();
		Session.set("inputOpen",null)
	},
	'click' (event) {
		var e = event.target.className;
		if(!(e.includes("creInput") || e.includes("select"))) {
			try {
				closeDivFade(document.getElementsByClassName("creInputSel")[Session.get("inputOpen")].parentNode.childNodes[4]);
			} catch(err) {}
		}
	}
});

Template.schoollist.helpers({
	name() {
		return this.name;
	}
});

function openDivFade(div) {
	div.style.display = "block";
	div.style.opacity = "0";
	setTimeout(function() {
		div.style.opacity = "1";
	}, 100);
}

function closeDivFade(div) {
	div.style.opacity = "0";
	setTimeout(function() {
		div.style.display = "none";
	}, 100);
}

function sendData() {
	// Take form data
}