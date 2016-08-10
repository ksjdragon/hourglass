import { Template } from 'meteor/templating';

Session.set("profInputOpen",null);
Session.set("profClassTab",null);
Session.set("modifying",null);
Session.set("radioDiv",null);

Template.profile.helpers({
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
		var banner = "defaultcover.jpg"; // Add personal user banner eventually
		return "width:"+width.toString()+"px;height:"+height.toString()+"px;background-image:url(\'"+banner+"\');background-size:"+width.toString()+"px "+height.toString()+"px";
	},
	avatar() {
		var dim = window.innerWidth * 1600/1920 * .16;
		var pic = "defaultAvatars/"+(Math.floor(Math.random() * (10 - 1)) + 1).toString()+".png"; // User personalization
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
		return "Say something about yourself!" // User personalization
	},
	school() {
		if(Meteor.user().profile.school !== null) {
			return "Click here to edit..."
		} else {
			return Meteor.user().profile.school;
		}
	},
	grade() {
		if(Meteor.user().profile.grade !== null) {
			return "Click here to edit..."
		} else {
			return Meteor.user().profile.grade;
		}
	},
	classes() {
		return classes.find( { status: { $eq: true }, privacy: { $eq: false }}, {sort: { subscribers: -1 }}).fetch();
	},
	profClassOpen(tab) {
		Session.set("profClassTab",tab);
	},
	profClassTab(tab) {
		if(tab === Session.get("profClassTab")) {
			return true;
		} else {
			return false;
		}
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
	'keyup' (event) {
		var sessval = Session.get("modifying");
		if(event.keyCode == 13) {
			try {
				closeInput(sessval);
			} catch(err) {}
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
	}
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
	if(input.value == "") {
		span.childNodes[0].nodeValue = "Click here to edit...";
	} else {
		span.childNodes[0].nodeValue = input.value;
	}
	span.style.display = "initial";
	Session.set("modifying",null);
}

