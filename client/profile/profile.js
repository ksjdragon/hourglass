import {
    Template
} from 'meteor/templating';

// Sets up global variables

Session.set("profInputOpen", null);
Session.set("profClassTab", "manClass");
Session.set("modifying", null);
Session.set("radioDiv", null);
Session.set("notsearching", true);
Session.set("confirm", null);
Session.set("serverData", null);
Session.set("autocompleteDivs", null);
Session.set("confirmText", null);
Session.set("selectedClass",null); 
Session.set("selectClassId",null);
Session.set("code",null);
Session.set("noclass",null);
Session.set("notfound",null);

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
    mainCenter() { // Centers main container
        var width = window.innerWidth * 1600 / 1920 + 10;
        return "width:" + width.toString() + "px;margin-left:" + -0.5 * width.toString() + "px";
    },
    mainHeight() {
        return window.innerHeight.toString() + "px";
    },
    banner() { //Styles the banner
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
    avatar() { //Styles the avatar
        var dim = window.innerWidth * 1600 / 1920 * 0.16;
        var pic = "";
        var userprofile = Meteor.user().profile.avatar;
        if (userprofile !== undefined && userprofile !== null) {
            pic = Meteor.user().profile.avatar;
        } else {
            pic = "Avatars/" + (Math.floor(Math.random() * (11 - 1)) + 1).toString() + ".png";
            currentprofile = Meteor.user().profile;
            currentprofile.avatar = pic;
            Meteor.call("editProfile", currentprofile);
        }
        return "background-image:url(" + pic + ");background-size:" + dim.toString() + "px " + dim.toString() + "px";
    },
    avatarDim() { //Dimensions the avatar
        var dim = window.innerWidth * 1600 / 1920 * 0.16;
        return "height:" + dim.toString() + "px;width:" + dim.toString() + "px;top:" + 0.43 * window.innerHeight.toString() + "px;";
    },
    username() {  //Returns current user's username
        return Meteor.user().profile.name;
    },
    motd() { //Returns the current user's description
        if (Meteor.user().profile.description) {
            return Meteor.user().profile.description;
        } else {
            return "Say something about yourself!";
        }
    },
    school() { //Returns the current user's school's name
        if (Meteor.user().profile.school) {
            return Meteor.user().profile.school;
        } else {
            return "Click here to edit...";
        }
    },
    grade() { //Returns the current user's grade
        if (Meteor.user().profile.grade) {
            return Meteor.user().profile.grade + "th";
        } else {
            return "Click here to edit...";
        }
    },
    classes() { //Loads all of the possible classes ( Limit of twenty shown ) ( Sorts by class size ) 
        var array = classes.find(
        {
            status: {$eq: true},
            privacy: {$eq: false},
            _id: {$nin: Meteor.user().profile.classes}
        },
        {sort: {subscribers: -1 }}, 
        {limit: 20}
        ).fetch();

        for(var i = 0; i < array.length; i++) {
            array[i].subscribers = array[i].subscribers.length;
        }
        if(array.length === 0) {
            Session.set("noclass",true);
        } else {
            Session.set("noclass",false);
        }
        return array;
    },
    profClassHeight() { // Dimensions the class height
        return 0.6 * window.innerHeight.toString() + "px";
    },
    classHolderHeight() { // Dimensions the container for the classes
        return 0.26 * window.innerHeight.toString() + "px";
    },
    profClassTabColor(status) { // Change this [Supposed to show the current mode that's selected via color]       
        if (status === Session.get("profClassTab")) {            
            return Session.get("themeColors")[Meteor.user().profile.preferences.theme].highlightText;        
        } else {            
            return;        
        }    
    },
    profClassTab(tab) { // Tells current class
        if (tab === Session.get("profClassTab")) {
            return true;
        } else {
            return false;
        }
    },
    notsearching() { // Tells whether user is using the searchbox
        return Session.get("notsearching");
    },
    autocompleteClasses() { // Returns current auto-completes for classes
        return Session.get("autocompleteDivs");
    },
    notfound() {
        return Session.get("notfound");
    },
    noclass()  {
        return Session.get("noclass");
    },
    confirmText() {
        return Session.get("confirmText");
    },
    selectedClass(val) {
        if(Session.get("selectClassId") === null) return;
        var usertype = ["moderators","banned"];
        var attribute = Session.get("selectClassId");
        var array = classes.findOne({_id:attribute});
        var code = Meteor.call('getCode',attribute);
        if(code === "") {
            array.code = "None";
            Session.set("code", false);
        } else {
            Session.set("code", true);
            array.code = code;
        }

        for(var i = 0; i < usertype.length; i++) {
            var users = array[usertype[i]];
            array[usertype[i]] = [];
            for(var j = 0; j < users.length; j++) {
                var detailusers = {};
                var user = Meteor.users.findOne({_id:users[j]});
                detailusers._id = user._id;
                detailusers.email = user.services.google.email;
                detailusers.name = user.profile.name;
                array[usertype[i]].push(detailusers);
            }
        }
        return array[val];
    },
    code() {
        return Session.get("code");
    },
    userHolder() {
        return 0.15 * window.innerHeight.toString() + "px";
    }
});

Template.profile.events({
    'click .change' (event) { // Allows changes to profile values
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
    'click' (event) { // Whenever a click happens
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
        if(!document.getElementById("createdClasses").contains(event.target) &&
        Session.get("code") !== null &&
        !event.target.className.includes("fa-times-circle-o")) {
            document.getElementById("createdClasses").style.marginRight = "-40%";
            setTimeout(function() { Session.set("selectedClass", null); }, 300);
        }
        if(Session.get("changeAdmin") &&
        !document.getElementById("changeAdmin").contains(event.target)) {
            Session.set("changeAdmin",false);
            var div = document.getElementById("changeAdmin");
            div.removeChild(div.childNodes[3]);
            div.removeChild(div.childNodes[3]);
        }
        if(Session.get("privateClass") &&
        !document.getElementById("joinPrivClass").contains(event.target)) {
            Session.set("privateClass",false);
            document.getElementById("joinPrivClass").style.marginBottom = "-10%";
        }
    },
    'keydown' (event) { // Whenever one key is pressed (for character restrictions)
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
    'click .radio' (event) { // Click on an input that has a drop-down menu
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
    'click .profOptionText' (event) { // When someone selects "drop-down item"
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
    'keyup #profClassSearch' (event) { // Auto-complete updater
        if (event.target.value.length === 0) {
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
                    subscribers: item.childNodes[7].childNodes[0].nodeValue.length/17,
                    _id: item.getAttribute("classid")
                });
                Session.set("autocompleteDivs", divs);
            }
        } catch (err) {}
    },
    'click .classBox' (event) {  // When you click on a box that holds class
        if (event.target.id === "label" || 
            Session.get("profClassTab") === "manClass" || 
            event.target.className.includes("fa-times")) return;

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
    'click .fa-check-circle-o' () { // Confirmation Button
        sendData(Session.get("confirm"));
        closeDivFade(document.getElementsByClassName("overlay")[0]);
        if(Session.get("confirm") === "createClass") {
            var form = document.getElementById("create");
            for(var i = 0; i < form.length; i++) form[i].value = "";
        }
        Session.set("serverData", null);
        Session.set("confirm", null);
    },
    'click .fa-times-circle-o' () { // Deny Button
        closeDivFade(document.getElementsByClassName("overlay")[0]);
        Session.set("serverData", null);
        Session.set("confirm", null);
    },
    'click #creSubmit' () { //Submits form data for class
        var data = getCreateFormData();
        if (data === null) return;
        Session.set("serverData", data);
        Session.set("confirm", "createClass");
        Session.set("confirmText", "Submit request?");

        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'focus .op' (event) { // Browser Casework
        event.target.click();
    },
    'click .owned' (event) { // When you click your own class
        if (event.target.id === "label") return;
        if (!event.target.className.includes("owned")) {
            var attribute = event.target.parentNode.getAttribute("classid");
        } else {
            var attribute = event.target.getAttribute("classid");
        }
        Session.set("selectClassId",attribute);
        document.getElementById("createdClasses").style.marginRight = "0";
    },
    'click .userAdder .fa-plus' (event) { // Gives/Removes User Privileges
        var input = event.target.parentNode.childNodes[3];
        input.placeholder = "1234@abc.xyz";
        input.className.replace(" formInvalid","");
        var value = input.value;
        var classid = document.getElementById("createdClasses").getAttribute("classid");
        input.value = "";
        if(checkUser(value,classid)) {
            input.className += " formInvalid";
            input.placeholder = "Not a valid user";
            return;
        }
        var user = Meteor.users.findOne({"services.google.email":value});
        Session.set("serverData", [
            user._id,
            classid,
            event.target.parentNode.childNodes[1].childNodes[0].nodeValue.replace(":","").toLowerCase()
        ]);
        sendData("trackUserInClass");

    },
    'click .classBox .fa-times' (event) { // Leaves a class
        var box = event.target.parentNode;
        var classid = box.getAttribute("classid");
        Session.set("serverData", box.getAttribute("classid"));
        Session.set("confirm","leaveClass");
        Session.set("confirmText", "Leave this class?");
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click .userBox .fa-times' (event) { // Removes user from permissions
        var box = event.target.parentNode;
        Session.set("serverData", [
            box.getAttribute("userid"),
            document.getElementById("createdClasses").getAttribute("classid"),
            box.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[0].nodeValue.replace(":","").toLowerCase()
        ])
        sendData("untrackUserInClass");
    },
    'click #copy' () { //Copies googlee-classroom style code
        if(document.getElementById("code").value === "None") return;
        document.getElementById("code").select();
        document.execCommand("copy");
    },
    'click #deleteClass' () { 
        Session.set("serverData",document.getElementById("createdClasses").getAttribute("classid"));
        Session.set("confirm", "deleteClass");
        Session.set("confirmText", "Delete this class?");
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #changeAdmin span' (event) { 
        if(Session.get("changeAdmin")) return;
        Session.set("changeAdmin",true);
        var input = document.createElement("input");
        input.placeholder = "1234@abc.xyz";
        var i = document.createElement("i");
        i.className = "fa fa-exchange";
        i.setAttribute("aria-hidden","true");
        event.target.parentNode.appendChild(input);
        event.target.parentNode.appendChild(i);
    },
    'click .fa-exchange' (event) { //Changes class admin upon confirmation
        var input = event.target.parentNode.childNodes[3];
        input.placeholder = "1234@abc.xyz";
        input.className.replace(" formInvalid","");
        var value = input.value;
        var classid = document.getElementById("createdClasses").getAttribute("classid");
        input.value = "";
        if(checkUser(value,classid)) {
            input.className += " formInvalid";
            input.placeholder = "Not a valid user";
            return;
        }
        var user = Meteor.users.findOne({"services.google.email":value});
        Session.set("serverData", [user._id,classid]);
        Session.set("confirm","changeAdmin");
        Session.set("confirmText", "Are you really sure?");
        openDivFade(document.getElementsByClassName("overlay")[0])
        document.getElementById("createdClasses").style.marginRight = "-40%";
    },
    'click #private' (event) { // Joins private class
        Session.set("privateClass",true);
        var input = document.getElementById("privateCode");
        input.className = "";
        input.placeholder = "Enter code here...";
        document.getElementById("joinPrivClass").style.marginBottom = "0";
    },
    'click #privSubmit' () { // Submits private class code
        var input = document.getElementById("privateCode");
        var code = input.value;
        input.value = "";
        Session.set("serverData", code);
        Meteor.call("joinPrivateClass", code, function(error, result) {
            if(result) {
                document.getElementById("joinPrivClass").style.marginBottom = "-10%";
            } else {
                input.className = "formInvalid";
                input.placeholder = "Invalid code.";
            }
        });
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
    var profile = Meteor.user().profile;
    profile.description = document.getElementById("motd").childNodes[0].nodeValue;
    profile.school = document.getElementById("school").childNodes[0].nodeValue;
    var gradein = document.getElementById("grade").childNodes[0].nodeValue;
    profile.grade = parseInt(gradein.substring(gradein.length - 2, gradein));
    profile.avatar = document.getElementById("profAvatar").style.backgroundImage.replace(")", "").replace("url(", "").replace("\"", "").replace("\"", "");
    profile.banner = document.getElementById("profBanner").style.backgroundImage.replace(")", "").replace("url(", "").replace("\"", "").replace("\"", "");
    profile.preferences = Meteor.user().profile.preferences;

    return profile;
}

function getCreateFormData() {
    var stop;
    var form = document.getElementsByClassName("creInput");
    for (var i = 0; i < form.length; i++) {
        if(i === 1 || i === 2) continue;
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

function checkUser(email,classid) {
     var user = Meteor.users.findOne({"services.google.email":email});
     if(user === undefined) {
        return true;
     } else {
        if(classes.findOne({_id:classid}).subscribers)
        return false;
     }
}