import { Template } from 'meteor/templating';

Session.set("profInputOpen",null);
Session.set("profClassTab","manClass");
Session.set("modifying",null);
Session.set("radioDiv",null);
Session.set("notsearching",true);
Session.set("confirm",null);
Session.set("serverData",null);
Session.set("autocompleteDivs", null);

var themeColors = {
	"light": {
		"header":"#EBEBEB",
		"sidebar":"#65839A",
		"statusIcons":"#33ADFF",
		"highlightText":"#FF1A1A",
		"cards":"#FEFEFE"
	},
	"dark": {

	}
};

Template.profile.helpers({
	classsettings: function() {
	    return {
	      position: "bottom",
	      limit: 10,
	      rules: [
	        {
	          token: '',
	          collection: classes,
	          field: "name",
	          template: Template.classDisplay,
	          filter: {status: true}
	        }
	      ]
	    };
	  },
	mainCenter() {
		var width = window.innerWidth * 1600/1920 + 10;
		return "width:"+width.toString()+"px;margin-left:"+-.5*width.toString()+"px"; 
	},
	mainHeight() {
		return window.innerHeight.toString()+"px";
	},
	banner() {
		var width = window.innerWidth * 1600/1920;
		var height = width * 615/1600;
		if(Meteor.user().profile.banner !== undefined) {
			var banner = Meteor.user().profile.banner;
		} else {
			var banner = "defaultcover.jpg";
		}
		return "width:"+width.toString()+"px;height:"+height.toString()+"px;background-image:url(\'"+banner+"\');background-size:"+width.toString()+"px "+height.toString()+"px";
	},
	avatar() {
		var dim = window.innerWidth * 1600/1920 * .16;
		if(Meteor.user().profile.avatar !== undefined) {
			var pic = Meteor.users().profile.avatar;
		} else {
			var pic = "defaultAvatars/"+(Math.floor(Math.random() * (10 - 1)) + 1).toString()+".png";
		}
		return "background-image:url("+pic+");background-size:"+dim.toString()+"px "+dim.toString()+"px";
	},
	avatarDim() {
		var dim = window.innerWidth * 1600/1920 * .16;
		return "height:"+dim.toString()+"px;width:"+dim.toString()+"px;top:"+.43*window.innerHeight.toString()+"px";
	},
	username() {
		return Meteor.user().profile.name;
	},
	motd() {
		if(Meteor.user().profile.description !== undefined) {
			return Meteor.user().profile.description;
		} else {
			return "Say something about yourself!";
		}
	},
	school() {
		if(Meteor.user().profile.school !== undefined) {
			return Meteor.user().profile.school;
		} else {
			return "Click here to edit...";
		}
	},
	grade() {
		if(Meteor.user().profile.grade !== undefined) {
			return Meteor.user().profile.grade;
		} else {
			return "Click here to edit...";
		}
	},
	classes() {
		return classes.find( { status: { $eq: true }, privacy: { $eq: false }}, {sort: { subscribers: -1 }}, {limit: 20}).fetch();
	},
	profClassHeight() {
		return .6*window.innerHeight.toString()+"px";
	},
	classHolderHeight() {
		return .26*window.innerHeight.toString()+"px";
	},
	profClassTabColor(status) {
        if(status === Session.get("profClassTab")) {
            return themeColors[Cookie.get("theme")].highlightText;
        } else {
            return;
        }
    },
	profClassTab(tab) {
		if(tab === Session.get("profClassTab")) {
			return true;
		} else {
			return false;
		}
	},
	notsearching() {
		return Session.get("notsearching");
	},
	autocompleteClasses() {
		return Session.get("autocompleteDivs");
	},
	myclasses() {
		return Meteor.user().profile.classes;
	}
})

Template.profile.events({
	'click #profile input' (event) {
		var opened = Session.get("profradioDiv");
		if(opened !== null && opened !== event.target.getAttribute("op")) {
			closeDivFade(document.getElementsByClassName("creInputSel")[opened].parentNode.childNodes[4]);
		}d
	},
	'click .profInputSel' (event) {
		Session.set("profradioDiv", event.target.getAttribute("op"));
		openDivFade(event.target.parentNode.childNodes[4]);
	},
	'click profOptions p' (event) {
		var p = event.target;
		p.parentNode.parentNode.childNodes[1].value = p.childNodes[0].nodeValue;
		closeDivFade(p.parentNode);
		Session.set("radioDiv",null);
	},
	'click .change' (event) {
		var ele = event.target;
		var sessval = Session.get("modifying");
		if(ele.id !== sessval && sessval != null) closeInput(sessval);

		Session.set("modifying", ele.id);
		var dim = ele.getBoundingClientRect();
		ele.style.display = "none";
		var input = document.createElement("input");
		
		if(ele.getAttribute("type") !== null) {
			input.type = ele.getAttribute("type");
		} else {
			input.type = "text";
		}
		input.value = ele.childNodes[0].nodeValue;
		input.className = "changeInput";
		input.style.height = .9*dim.height.toString()+"px";
		input.style.width = "70%";
		input.style.padding = "0.1%";
		input.id = ele.id+"a";
		ele.parentNode.appendChild(input);
		if(ele.getAttribute("re") == "readonly") {
			input.readOnly = true;
			input.style.cursor = "pointer";
		} else {
			input.select();
		}
		input.focus();
		if(ele.getAttribute("restrict") !== null) {
			var span = document.createElement("span");
			span.id = "restrict";
			var num = parseInt(ele.getAttribute("restrict"))-input.value.length;
			if(num <= 0) {
				span.style.setProperty("color","#FF1A1A","important");
				num = 0;
			}
			span.appendChild(document.createTextNode(num.toString()+" characters left"));
			ele.parentNode.appendChild(span);
		}	
	},
	'click' (event) {
		var sessval = Session.get("modifying");
		if(event.target.id !== sessval && event.target.id !== sessval+"a" && !Session.equals("modifying",null) && !event.target.parentNode.className.includes("profOptions")) {
			closeInput(sessval);
		}
		if(!event.target.className.includes("radio") && !Session.equals("radioDiv",null) && !event.target.parentNode.className.includes("profOptions")) {
			closeDivFade(document.getElementsByClassName("profOptions")[Session.get("radioDiv")]);
		}	
	},
	'keydown' (event) {
		var sessval = Session.get("modifying");
		if(event.keyCode == 13) {
			try {
				closeInput(sessval);
			} catch(err) {}
		}
		var restrict = document.getElementById(sessval).getAttribute("restrict");
		if(restrict !== null) {
			var num = parseInt(restrict)-event.target.value.length;
			var restext = document.getElementById("restrict");
			if(num === 1) {
				restext.childNodes[0].nodeValue = num.toString()+" character left";
				restext.style.setProperty("color","#999","important");
			} else if(num <= 0) {
				var input = document.getElementById(sessval+"a");
				input.value = input.value.substring(0,parseInt(restrict));
				restext.childNodes[0].nodeValue = "0 characters left";
				restext.style.setProperty("color","#FF1A1A","important");
			} else {
				restext.childNodes[0].nodeValue = num.toString()+" characters left";
				restext.style.setProperty("color","#999","important");
			}
		}
	},
	'click .radio' (event) {
		Session.set("radioDiv", event.target.getAttribute("op"));
		openDivFade(event.target.parentNode.parentNode.childNodes[3]);
	},
	'click .profOptions p' (event) {
		var sessval = Session.get("modifying");
		var p = event.target;
		var input = p.parentNode.parentNode.childNodes[1].childNodes[5];		
		input.value = p.childNodes[0].nodeValue;
		closeInput(sessval);
		closeDivFade(p.parentNode);
		input.focus();
		Session.set("radioDiv",null)
	},
	'click .addClass' () {
        var functionHolder = document.getElementById("profClassInfoHolder")
        closeDivFade(functionHolder);
        setTimeout(function() {
            Session.set("profClassTab","addClass");
            openDivFade(functionHolder);
        },300);
    },
    'click .manageClass' () {
        var functionHolder = document.getElementById("profClassInfoHolder")
        closeDivFade(functionHolder);
        setTimeout(function() {
            Session.set("profClassTab","manClass");
            openDivFade(functionHolder);
        },300);
    },
    'click .createClass' () {
        var functionHolder = document.getElementById("profClassInfoHolder")
        closeDivFade(functionHolder);
        setTimeout(function() {
            Session.set("profClassTab","creClass");
            openDivFade(functionHolder);
        },300);
    },
	'click .fa-search' () {
		Session.set("searching",true);
	},
	'click .fa-times-thin' () {
		Session.set("searching",false);
	},
	'keydown #profClassSearch' (event) {
		if(event.target.value === "") {
			Session.set("notsearching",true);
		} else {
			Session.set("notsearching",false);
		}
		divs = [];
		try {
			var items = document.getElementsByClassName("-autocomplete-container")[0].childNodes[3].childNodes;
			for(var i = 2; i < items.length; i+=3) {
				var item = items[i].childNodes[3];
				divs.push({
						name: item.childNodes[1].childNodes[0].nodeValue,
						teacher: item.childNodes[3].childNodes[0].nodeValue,
						hour: item.childNodes[5].childNodes[0].nodeValue,
						subscribers: item.childNodes[7].childNodes[0].nodeValue,
						_id:item.getAttribute("classid")
				});
				Session.set("autocompleteDivs", divs);
			}
		} catch(err) {}
	},
	'click .classBox' (event) {
		if(event.target.getAttribute("classid") === null) return;
		openDivFade(document.getElementsByClassName("overlay")[0]);
		setTimeout(function() {
			document.getElementsByClassName("overlay")[0].style.opacity = "1";
		}, 200);
		Session.set("serverData",[event.target.getAttribute("classid"),""]);
		Session.set("confirm","joinClass");
	},
	'click .fa-check-circle-o' () {
		sendData(Session.get("confirm"));
		closeDivFade(document.getElementsByClassName("overlay")[0]);
		Session.set("serverData",null);
		Session.set("confirm",null);
	},
	'click .fa-times-circle-o' () {
		closeDivFade(document.getElementsByClassName("overlay")[0]);
		closeDivFade(document.getElementById("functionHolder"));
		Session.set("serverData",null);
		Session.set("confirm",null);
	},
})

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

function closeInput(sessval) {
	var input = document.getElementById(sessval+"a");
	var span = document.getElementById(sessval);
	input.parentNode.removeChild(input);
	try{
		var restrict = document.getElementById("restrict");
		restrict.parentNode.removeChild(restrict)
	} catch(err) {}
	if(input.value == "") {
		span.childNodes[0].nodeValue = "Click here to edit...";
	} else {
		span.childNodes[0].nodeValue = input.value;
	}
	span.style.display = "initial";
	Session.set("modifying",null);
}

function sendData(funcName) {
	Meteor.call(funcName,Session.get("serverData"));
}