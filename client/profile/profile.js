import {
    Template
} from 'meteor/templating';


Meteor.subscribe('schools');
Meteor.subscribe('classes');
Meteor.subscribe('work');

Session.set("profInputOpen", null);
Session.set("profClassTab", "manClass");
Session.set("modifying", null);
Session.set("radioDiv", null);
Session.set("notsearching", true);
Session.set("confirm", null);
Session.set("serverData", null);
Session.set("autocompleteDivs", null);
Session.set("confirmText", null);

var themeColors = {
    "light": {
        "header": "#EBEBEB",
        "sidebar": "#65839A",
        "statusIcons": "#33ADFF",
        "highlightText": "#FF1A1A",
        "cards": "#FEFEFE"
    },
    "dark": {

    }
};

Template.profile.helpers({
    classsettings: function() {
        return {
            position: "bottom",
            limit: 10,
            rules: [{
                token: '',
                collection: classes,
                field: "name",
                template: Template.classDisplay,
                filter: {
                    privacy: false,
                    status: true
                }
            }]
        };
    },
    schoolcomplete() {
        return {
            position: "bottom",
            limit: 6,
            rules: [{
                token: '',
                collection: schools,
                field: 'name',
                matchAll: true,
                template: Template.schoollist
            }]
        };
    },
    teachercomplete() {
        return {
            position: "bottom",
            limit: 1,
            rules: [{
                token: '',
                collection: classes,
                field: 'teacher',
                template: Template.teacherlist
            }]
        };
    },
    mainCenter() {
        var width = window.innerWidth * 1600 / 1920 + 10;
        return "width:" + width.toString() + "px;margin-left:" + -0.5 * width.toString() + "px";
    },
    mainHeight() {
        return window.innerHeight.toString() + "px";
    },
    banner() {
        var width = window.innerWidth * 1600 / 1920;
        var height = width * 615 / 1600;
        if (Meteor.user().profile.banner !== undefined) {
            var banner = Meteor.user().profile.banner;
        } else {
            var banner = "Banners/defaultcover.jpg";
            currentprofile = Meteor.user().profile;
            currentprofile.banner = banner
            Meteor.call("editProfile", currentprofile);
        }
        return "width:" + width.toString() + "px;height:" + height.toString() + "px;background-image:url(" + banner + ");background-size:" + width.toString() + "px " + height.toString() + "px";
    },
    avatar() {
        var dim = window.innerWidth * 1600 / 1920 * 0.16;
        if (Meteor.user().profile.avatar !== undefined) {
            var pic = Meteor.user().profile.avatar + ".png";
        } else {
            var pic = "Avatars/" + (Math.floor(Math.random() * (11 - 1)) + 1).toString(); + ".png";
            currentprofile = Meteor.user().profile;
            currentprofile.avatar = pic
            Meteor.call("editProfile", currentprofile);
        }
        return "background-image:url(" + pic + ");background-size:" + dim.toString() + "px " + dim.toString() + "px";
    },
    avatarDim() {
        var dim = window.innerWidth * 1600 / 1920 * 0.16;
        return "height:" + dim.toString() + "px;width:" + dim.toString() + "px;top:" + 0.43 * window.innerHeight.toString() + "px;";
    },
    username() {
        return Meteor.user().profile.name;
    },
    motd() {
        if (Meteor.user().profile.description) {
            return Meteor.user().profile.description;
        } else {
            return "Say something about yourself!";
        }
    },
    school() {
        if (Meteor.user().profile.school) {
            return Meteor.user().profile.school;
        } else {
            return "Click here to edit...";
        }
    },
    grade() {
        if (Meteor.user().profile.grade) {
            return Meteor.user().profile.grade + "th";
        } else {
            return "Click here to edit...";
        }
    },
    classes() {
        return classes.find(
        {
            status: {$eq: true},
            privacy: {$eq: false},
            _id: {$nin: Meteor.user().profile.classes}
        },
        {sort: {subscribers: -1	}}, 
    	{limit: 20}
    	).fetch();
    },
    profClassHeight() {
        return 0.6 * window.innerHeight.toString() + "px";
    },
    classHolderHeight() {
        return 0.26 * window.innerHeight.toString() + "px";
    },
    profClassTabColor(status) {        
        if (status === Session.get("profClassTab")) {            
            return themeColors[Cookie.get("theme")].highlightText;        
        } else {            
            return;        
        }    
    },
    profClassTab(tab) {
        if (tab === Session.get("profClassTab")) {
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
    	if (Meteor.user().profile.classes === undefined || Meteor.user().profile.classes.length === 0) {
    		return [];
    	} else {
    		var array = [];
    		var courses = Meteor.user().profile.classes;
    		for(var i = 0; i < courses.length; i++) {
    			array.push(classes.findOne({_id:courses[i]}));
    		}
    		return array;
    	}
    },
    notfound() {
        return Session.get("notfound");
    },
    confirmText() {
        return Session.get("confirmText");
    }
});

Template.profile.events({
    'click profOptions p' (event) {
        var p = event.target;
        p.parentNode.parentNode.childNodes[1].value = p.childNodes[0].nodeValue;
        closeDivFade(p.parentNode);
        Session.set("radioDiv", null);
        Session.set("radioOffset", null);
    },
    'click .change' (event) {
        var ele = event.target;
        var sessval = Session.get("modifying");
        if (ele.id !== sessval && sessval !== null) closeInput(sessval);

        Session.set("modifying", ele.id);
        var dim = ele.getBoundingClientRect();
        ele.style.display = "none";
        var input = document.createElement("input");

        if (ele.getAttribute("type") !== null) {
            input.type = ele.getAttribute("type");
        } else {
            input.type = "text";
        }
        input.value = ele.childNodes[0].nodeValue;
        input.className = "changeInput";
        input.style.height = 0.9 * dim.height.toString() + "px";
        input.style.width = "70%";
        input.style.padding = "0.1%";
        input.id = ele.id + "a";
        input.setAttribute("opc", ele.getAttribute("opc"));
        ele.parentNode.appendChild(input);
        if (ele.getAttribute("re") == "readonly") {
            input.readOnly = true;
            input.className += " op";
            input.style.cursor = "pointer";
        } else {
            input.select();
        }
        input.focus();
        if (ele.getAttribute("restrict") !== null) {
            var span = document.createElement("span");
            span.id = "restrict";
            var num = parseInt(ele.getAttribute("restrict")) - input.value.length;
            if (num <= 0) {
                span.style.setProperty("color", "#FF1A1A", "important");
                num = 0;
            }
            span.appendChild(document.createTextNode(num.toString() + " characters left"));
            ele.parentNode.appendChild(span);
        }
    },
    'click' (event) {
        var sessval = Session.get("modifying");
        if (event.target.id !== sessval &&
            event.target.id !== sessval + "a" &&
            !Session.equals("modifying", null) &&
            !event.target.parentNode.className.includes("profOptions")) {
            closeInput(sessval);
        }
        if (!event.target.className.includes("radio") &&
            !Session.equals("radioDiv", null) &&
            !event.target.parentNode.className.includes("profOptions") &&
            event.target.readOnly !== true) {
            var opnum = (parseInt(Session.get("radioDiv")) - parseInt(Session.get("radioOffset"))).toString();
            for (var i = 0; i < document.getElementsByClassName("profOptions").length; i++) {
                try {
                    closeDivFade(document.getElementsByClassName("profOptions")[i]);
                } catch (err) {}
            }
            Session.set("radioDiv", null);
            Session.set("radioOffset", null);
        }
    },
    'keydown' (event) {
        var sessval = Session.get("modifying");
        if (event.keyCode == 13) {
            try {
                closeInput(sessval);
            } catch (err) {}
        }
        if (sessval !== null && event.keyCode !== 13) {
            var restrict = document.getElementById(sessval).getAttribute("restrict");
            if (restrict !== null) {
                var num = parseInt(restrict) - event.target.value.length;
                var restext = document.getElementById("restrict");
                if (num === 1) {
                    restext.childNodes[0].nodeValue = num.toString() + " character left";
                    restext.style.setProperty("color", "#999", "important");
                } else if (num <= 0) {
                    var input = document.getElementById(sessval + "a");
                    input.value = input.value.substring(0, parseInt(restrict));
                    restext.childNodes[0].nodeValue = "0 characters left";
                    restext.style.setProperty("color", "#FF1A1A", "important");
                } else {
                    restext.childNodes[0].nodeValue = num.toString() + " characters left";
                    restext.style.setProperty("color", "#999", "important");
                }
            }
        }
    },
    'click .radio' (event) {
        var op = event.target;
        Session.set("radioDiv", op.getAttribute("op"));
        Session.set("radioOffset", op.getAttribute("opc"));
        try {
            for (var i = 0; i < document.getElementsByClassName("profOptions").length; i++) {
                var curr = document.getElementsByClassName("profOptions")[i];
                if (Session.get("radioDiv") !== i.toString()) {
                    closeDivFade(document.getElementsByClassName("profOptions")[i]);
                }
            }
        } catch (err) {}
        openDivFade(document.getElementsByClassName("profOptions")[op.getAttribute("op")]);
    },
    'click .profOptions p' (event) {
        var sessval = Session.get("modifying");
        var p = event.target;
        var opnum = parseInt(Session.get("radioDiv")) - parseInt(Session.get("radioOffset"));
        var input = document.getElementsByClassName("op")[opnum];
        input.value = p.childNodes[0].nodeValue;
        try {
            closeInput(sessval);
        } catch (err) {}

        closeDivFade(p.parentNode);
        input.focus();
        Session.set("radioDiv", null);
        Session.set("radioOffset", null);
    },
    'click .addClass' () {        
        var functionHolder = document.getElementById("profClassInfoHolder");
        closeDivFade(functionHolder);        
        setTimeout(function() {            
            Session.set("profClassTab", "addClass");            
            openDivFade(functionHolder);        
        }, 300);    
    },
    'click .manageClass' () {        
	    var functionHolder = document.getElementById("profClassInfoHolder");
	    closeDivFade(functionHolder);        
	    setTimeout(function() {            
	        Session.set("profClassTab", "manClass");            
	        openDivFade(functionHolder);        
	    }, 300);    
    },
    'click .createClass' () {        
	    var functionHolder = document.getElementById("profClassInfoHolder");        
	    closeDivFade(functionHolder);        
	    setTimeout(function() {            
	        Session.set("profClassTab", "creClass");            
	        openDivFade(functionHolder);        
	    }, 300);    
    },
    'click .fa-search' () {
        Session.set("searching", true);
    },
    'click .fa-times-thin' () {
        Session.set("searching", false);
    },
    'keydown #profClassSearch' (event) {
        if (event.target.value === "") {
            Session.set("notsearching", true);
        } else {
            Session.set("notsearching", false);
        }
        Session.set("autocompleteDivs", null);
        var divs = [];
        try {
            var items = document.getElementsByClassName("-autocomplete-container")[0].childNodes[3].childNodes;
            if (items.length === 0) {
                Session.set("notfound", true);
            } else {
                Session.set("notfound", false);
            }
            for (var i = 2; i < items.length; i += 3) {
                var item = items[i].childNodes[3];
                if(Meteor.user().profile.classes.indexOf(item.getAttribute("classid")) !== -1) continue;
                divs.push({
                    name: item.childNodes[1].childNodes[0].nodeValue,
                    teacher: item.childNodes[3].childNodes[0].nodeValue,
                    hour: item.childNodes[5].childNodes[0].nodeValue,
                    subscribers: item.childNodes[7].childNodes[0].nodeValue,
                    _id: item.getAttribute("classid")
                });
                Session.set("autocompleteDivs", divs);
            }
        } catch (err) {}
    },
    'click .classBox' (event) {
        if (event.target.id === "label" || Session.get("profClassTab") === "manClass") return;
        if (event.target.className !== "classBox") {
            var attribute = event.target.parentNode.getAttribute("classid");
        } else {
            var attribute = event.target.getAttribute("classid");
        }
        var data = [attribute, ""];
        Session.set("serverData", data);
        Session.set("confirm", "joinClass");
        Session.set("confirmText", "Join class?");

        openDivFade(document.getElementsByClassName("overlay")[0]);
        setTimeout(function() {
            document.getElementsByClassName("overlay")[0].style.opacity = "1";
        }, 200);
    },
    'click .fa-check-circle-o' () {
        sendData(Session.get("confirm"));
        closeDivFade(document.getElementsByClassName("overlay")[0]);
        if(Session.get("confirm") === "createClass") {
        	var form = document.getElementById("create");
        	for(var i = 0; i < form.length; i++) form[i].value = "";
        }
        Session.set("serverData", null);
        Session.set("confirm", null);
    },
    'click .fa-times-circle-o' () {
        closeDivFade(document.getElementsByClassName("overlay")[0]);
        Session.set("serverData", null);
        Session.set("confirm", null);
    },
    'click #save' () {
        Session.set("serverData", getProfileData());
        Session.set("confirm", "editProfile");
        Session.set("confirmText", "Save new profile settings?");

        openDivFade(document.getElementsByClassName("overlay")[0]);
        setTimeout(function() {
            document.getElementsByClassName("overlay")[0].style.opacity = "1";
        }, 200);
    },
    'click #creSubmit' () {
        var data = getCreateFormData();
        if (data === null) return;
        Session.set("serverData", data);
        Session.set("confirm", "createClass");
        Session.set("confirmText", "Submit request?");

        openDivFade(document.getElementsByClassName("overlay")[0]);
        setTimeout(function() {
            document.getElementsByClassName("overlay")[0].style.opacity = "1";
        }, 200);
    },
    'focus .op' (event) {
        event.target.click();
    }
});

function openDivFade(div) {
    if (div.className === "profOptions") {
        div.style.display = "inline-block";
    } else {
        div.style.display = "block";
    }
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
    var input = document.getElementById(sessval + "a");
    var span = document.getElementById(sessval);
    input.parentNode.removeChild(input);
    try {
        var restrict = document.getElementById("restrict");
        restrict.parentNode.removeChild(restrict);
    } catch (err) {}
    if (input.value === "") {
        span.childNodes[0].nodeValue = "Click here to edit...";
    } else {
        span.childNodes[0].nodeValue = input.value;
    }
    span.style.display = "initial";
    Session.set("modifying", null);
    Session.set("serverData", getProfileData());
    sendData("editProfile");
}

function sendData(funcName) {
    Meteor.call(funcName, Session.get("serverData"));
}

function getProfileData() {
    var description = document.getElementById("motd").childNodes[0].nodeValue;
    var school = document.getElementById("school").childNodes[0].nodeValue;
    var gradein = document.getElementById("grade").childNodes[0].nodeValue;
    var grade = parseInt(gradein.substring(gradein.length - 2, gradein));
    var avatar = document.getElementById("profAvatar").style.backgroundImage.replace(")", "").replace("url(", "").replace("\"", "").replace("\"", "");
    var banner = document.getElementById("profBanner").style.backgroundImage.replace(")", "").replace("url(", "").replace("\"", "").replace("\"", "");

    return {
        school: school,
        grade: grade,
        description: description,
        avatar: avatar,
        banner: banner
    };
}

function getCreateFormData() {
    var stop;
    var form = document.getElementsByClassName("creInput");
    for (var i = 0; i < form.length; i++) {
        if (form[i].value === "") {
            form[i].focus();
            form[i].placeholder = "Missing field";
            form[i].className += " formInvalid";
            stop = true;
        } else {
            form[i].className = form[i].className.replace(" formInvalid", "");
        }
    }
    if (stop) return null;

    var school = form[0].value;
    var hour = form[1].value;
    var teacher = form[2].value;
    var name = form[3].value;
    if (form[4].value == "Public") {
        var privacy = false;
    } else {
        var privacy = true;
    }
    var category = form[5].value.toLowerCase();
    return {
        school: school,
        hour: hour,
        teacher: teacher,
        name: name,
        privacy: privacy,
        category: category,
        status: false,
        code: ""
    };
}
