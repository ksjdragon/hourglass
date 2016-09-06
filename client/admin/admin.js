Session.set("adminTab","aClasses");

Template.admin.helpers({
	banner() {
		return "background-image:url(" + Session.get("user").banner + ")";
	},
	filters() {
		return [{filter:"Lol"}];
	},
	adminTab(val) {
		return Session.equals("adminTab",val);
	},
	adminTabColor(val) {
		var value = {true:"header",false:"adminButtons"};
		return themeColors[Session.get("user").preferences.theme][value[Session.equals("adminTab",val)]];
	},
	collection(val) {
		switch(val) {
			case "classes":
				var userClasses = classes.find().fetch();
				for(var i = 0; i < userClasses.length; i++) {
					if(userClasses[i].privacy) {
						userClasses[i].privacy = "True";
					} else {
						userClasses[i].privacy = "False";
					}

					if(userClasses[i].code === "") {
						userClasses[i].code = "None";
					}
					userClasses[i].category = userClasses[i].category.charAt(0).toUpperCase() + userClasses[i].category.slice(1);
					userClasses[i].admin = getEmail(userClasses[i].admin);
					var types = ["subscribers","moderators","banned"];
					for(var j = 0; j < types.length; j++) {

						if(userClasses[i][types[j]].length === 0) {
							userClasses[i][types[j]][k] = {"email":"None","none":false};
							continue;
						}

						for(var k = 0; k < userClasses[i][types[j]].length; k++) {
							userClasses[i][types[j]][k] =  {
								"email": getEmail(userClasses[i][types[j]][k]),
								"none":true
							};
						}
					}
				}
				return userClasses;
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
		Session.set("adminTab",event.target.id);
	},
	'click .fa-files-o' (event) {
		document.getElementById("copyArea").value = event.target.parentNode.childNodes[3].childNodes[0].nodeValue;
		document.getElementById("copyArea").select();
		document.execCommand("copy");
	},
	'click .fa-pencil-square-o' (event) {
		var value = event.target.parentNode.childNodes[3].className.replace("modify ","");
		openDivFade(document.getElementsByClassName("overlay")[0]);
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

function getEmail(id) {
	return Meteor.users.findOne({_id:id}).services.google.email;
}