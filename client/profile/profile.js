import {
    Template
} from 'meteor/templating';

confirm = null; // Sets function to execute after confirmation click.

// Sets up global variables

Session.set("profClassTab", "manClass"); // Set default classes card mode to 'Manage Classes.'
Session.set("modifying", null); // Stores current open input.
Session.set("notsearching", true); // If user is searching in search box.
Session.set("autocompleteDivs", null); // Stores returned autocomplete results.
Session.set("confirmText", null); // Stores text for different confirmation functions.
Session.set("selectClassId",null); // Stores selected owned class ID.
Session.set("code",null); // If owned class has a code.
Session.set("noclass",null); // If user doesn't have classes.
Session.set("notfound",null); // If no results for autocomplete.

Template.profile.helpers({
    classSettings() { // Returns autocomplete array for classes.
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
    schoolComplete() { // Returns autocomplete array for schools.
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
    teacherComplete() { // Returns autocomplete array for teachers.
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
    mainCenter() { // Centers main div container.
        var width = window.innerWidth * 1600 / 1920 + 10;
        return "width:" + width.toString() + "px;margin-left:" + -0.5 * width.toString() + "px";
    },
    mainHeight() { // Returns height of screen for div.
        return window.innerHeight.toString() + "px";
    },
    banner() { // Styles the banner
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
    avatar() { // Styles the avatar
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
    avatarDim() { // Dimensions of the avatar
        var dim = window.innerWidth * 1600 / 1920 * 0.16;
        return "height:" + dim.toString() + "px;width:" + dim.toString() + "px;top:" + 0.43 * window.innerHeight.toString() + "px;";
    },
    username() {  //Returns current user's username
        return Meteor.user().profile.name;
    },
    motd() { // Returns the current user's description
        if (Meteor.user().profile.description) {
            return Meteor.user().profile.description;
        } else {
            return "Say something about yourself!";
        }
    },
    school() { // Returns the current user's school's name
        if (Meteor.user().profile.school) {
            return Meteor.user().profile.school;
        } else {
            return "Click here to edit...";
        }
    },
    grade() { // Returns the current user's grade
        if (Meteor.user().profile.grade) {
            return Meteor.user().profile.grade + "th";
        } else {
            return "Click here to edit...";
        }
    },
    classes() { // Loads all of the possible classes ( Limit of twenty shown ) ( Sorts by class size ) 
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
            return themeColors[Meteor.user().profile.preferences.theme].highlightText;        
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
    notfound() { // Returns if autocomplete has no results.
        return Session.get("notfound");
    },
    noclass()  { // Returns if user has classes.
        return Session.get("noclass");
    },
    confirmText() { // Returns respective text for different confirm functions.
        return Session.get("confirmText");
    },
    selectedClass(val) { // Returns values for selectedClass
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
    code() { // Returns if selected class has code.
        return Session.get("code");
    },
    userHolder() { // Returns height of user holders for moderators/banned.
        return 0.15 * window.innerHeight.toString() + "px";
    }
});

Template.profile.events({
    'click' (event) { // Whenever a click happens
        var modifyingInput = Session.get("modifying");
        if (event.target.id !== modifyingInput &&
        event.target.id !== modifyingInput + "a" &&
        !Session.equals("modifying", null) &&
        !event.target.parentNode.className.includes("profOptions")) {
            closeInput(modifyingInput);
        }
        if (!event.target.className.includes("radio") &&
        !event.target.parentNode.className.includes("profOptions") &&
        event.target.readOnly !== true) {
            for (var i = 0; i < document.getElementsByClassName("profOptions").length; i++) {
                try {
                    closeDivFade(document.getElementsByClassName("profOptions")[i]);
                } catch (err) {}
            }
        }
        if(!document.getElementById("createdClasses").contains(event.target) &&
        Session.get("code") !== null &&
        !event.target.className.includes("fa-times-circle-o")) {
            document.getElementById("createdClasses").style.marginRight = "-40%";
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
    // MAIN BUTTONS
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
        serverData = data;
        confirm = "joinClass";
        Session.set("confirmText", "Join class?");

        openDivFade(document.getElementsByClassName("overlay")[0]);
        setTimeout(function() {
            document.getElementsByClassName("overlay")[0].style.opacity = "1";
        }, 200);
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
    'click .classBox .fa-times' (event) { // Leaves a class
        var box = event.target.parentNode;
        var classid = box.getAttribute("classid");
        serverData = box.getAttribute("classid");
        confirm = "leaveClass";
        Session.set("confirmText", "Leave this class?");
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #creSubmit' () { //Submits form data for class
        var data = getCreateFormData();
        if (data === null) return;
        serverData = data;
        confirm = "createClass";
        Session.set("confirmText", "Submit request?");

        openDivFade(document.getElementsByClassName("overlay")[0]);
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
        serverData = code;
        Meteor.call("joinPrivateClass", code, function(error, result) {
            if(result) {
                document.getElementById("joinPrivClass").style.marginBottom = "-10%";
            } else {
                input.className = "formInvalid";
                input.placeholder = "Invalid code.";
            }
        });
    },
    // OWNED CLASS BUTTONS=
    'click #copy' () { // Copies code for private classes.
        if(document.getElementById("code").value === "None") return;
        document.getElementById("code").select();
        document.execCommand("copy");
    },
    'click .userAdder .fa-plus' (event) { // Gives/Removes user privileges
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
        serverData = [
            user._id,
            classid,
            event.target.parentNode.childNodes[1].childNodes[0].nodeValue.replace(":","").toLowerCase(),
            true
        ];
        sendData("trackUserInClass");
    },
    'click .userBox .fa-times' (event) { // Removes user from permissions
        var box = event.target.parentNode;
        serverData = [
            box.getAttribute("userid"),
            document.getElementById("createdClasses").getAttribute("classid"),
            box.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[0].nodeValue.replace(":","").toLowerCase(),
            false
        ];
        sendData("trackUserInClass");
    },
    'click #deleteClass' () { 
        serverData = document.getElementById("createdClasses").getAttribute("classid");
        confirm = "deleteClass";
        Session.set("confirmText", "Delete this class?");
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #changeAdmin span' (event) { // Click to give ownership of class.
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
        serverData = [user._id,classid];
        confirm = "changeAdmin";
        Session.set("confirmText", "Are you really sure?");
        openDivFade(document.getElementsByClassName("overlay")[0])
        document.getElementById("createdClasses").style.marginRight = "-40%";
    },
    // OVERLAY BUTTONS
    'click .fa-check-circle-o' () { // Confirmation Button
        sendData(confirm);
        closeDivFade(document.getElementsByClassName("overlay")[0]);
        if(confirm === "createClass") {
            var form = document.getElementById("create");
            for(var i = 0; i < form.length; i++) form[i].value = "";
        }
        serverData = null;
        confirm = null;
    },
    'click .fa-times-circle-o' () { // Deny Button
        closeDivFade(document.getElementsByClassName("overlay")[0]);
        serverData = null;
        confirm = null;
    },
    // INPUT HANDLING
    'click .change' (event) { // Click changable inputs. Creates an input where the span is.
        var ele = event.target;
        var modifyingInput = Session.get("modifying");
        if (ele.id !== modifyingInput && modifyingInput !== null) closeInput(modifyingInput);

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
    'click .radio' (event) { // Click dropdown input. Opens the dropdown menu.
        var op = event.target;
        try {
            for (var i = 0; i < document.getElementsByClassName("profOptions").length; i++) {
                var curr = document.getElementsByClassName("profOptions")[i];
                if (curr.childNodes[1] !== op.nextSibling.nextSibling.childNodes[1] 
                    && curr.childNodes[1] !== op.parentNode.parentNode.childNodes[3].childNodes[1]) {
                    closeDivFade(document.getElementsByClassName("profOptions")[i]);
                }
            }
        } catch (err) {}

        if(event.target.className.includes("op")) {
            openDivFade(op.nextSibling.nextSibling);  
        } else {
            openDivFade(op.parentNode.parentNode.childNodes[3]);
        }
    },
    'keydown' (event) { // Restricts characters for certain inputs.
        var modifyingInput = Session.get("modifying");
        if (event.keyCode == 13) {
            try {
                closeInput(modifyingInput);
            } catch (err) {}
        }
        if (modifyingInput !== null && event.keyCode !== 13) {
            var restrict = document.getElementById(modifyingInput).getAttribute("restrict");
            if (restrict !== null) {
                var num = parseInt(restrict) - event.target.value.length;
                var restext = document.getElementById("restrict");
                if (num === 1) {
                    restext.childNodes[0].nodeValue = num.toString() + " character left";
                    restext.style.setProperty("color", "#999", "important");
                } else if (num <= 0) {
                    var input = document.getElementById(modifyingInput + "a");
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
    'click .profOptionText' (event) { // Click each profile option setting.
        var modifyingInput = Session.get("modifying");
        var p = event.target;
        if(p.className.includes("cre")) {
            var input = p.parentNode.parentNode.childNodes[3]
        } else {
            var input = p.parentNode.parentNode.childNodes[1].childNodes[5];
        }
        input.value = p.childNodes[0].nodeValue;
        try {
            closeInput(modifyingInput);
        } catch (err) {}

        closeDivFade(p.parentNode);
        input.focus();
    },
    // AUTOCOMPLETE HANDLING
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
            if (items.length === 0) { // If no results.
                Session.set("notfound", true);
            } else {
                Session.set("notfound", false);
            }
            for (var i = 2; i < items.length; i += 3) { // Iterate through autocomplete div.
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
    'focus .op' (event) { // Selects input for next tabbing.
        event.target.click();
    },
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

function closeInput(modifyingInput) { // Closes current modifying input.
    var input = document.getElementById(modifyingInput + "a");
    var span = document.getElementById(modifyingInput);
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
    serverData = getProfileData();
    sendData("editProfile");
}

function sendData(funcName) {
    Meteor.call(funcName, serverData);
}

function getProfileData() { // Gets all data related to profile.
    var profile = Meteor.user().profile;
    profile.description = document.getElementById("motd").childNodes[0].nodeValue;
    profile.school = document.getElementById("school").childNodes[0].nodeValue;
    var gradein = document.getElementById("grade").childNodes[0].nodeValue;
    profile.grade = parseInt(gradein.substring(gradein.length - 2, gradein));
    profile.avatar = document.getElementById("profAvatar").style.backgroundImage.replace(")", "").replace("url(", "").replace("\"", "").replace("\"", "");
    profile.banner = document.getElementById("profBanner").style.backgroundImage.replace(")", "").replace("url(", "").replace("\"", "").replace("\"", "");
    profile.preferences = {
        "theme":document.getElementById("prefTheme").childNodes[0].nodeValue.toLowerCase(),
        "mode":document.getElementById("prefMode").childNodes[0].nodeValue.toLowerCase(),
        "timeHide":document.getElementById("prefHide").childNodes[0].nodeValue
    };

    return profile;
}

function getCreateFormData() { // Gets create class form data, and returns null.
    var stop;
    var form = document.getElementsByClassName("creInput");
    for (var i = 0; i < form.length; i++) { // Checks for missing/invalid fields.
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

function checkUser(email,classid) { // Checks if user email exists.
     var user = Meteor.users.findOne({"services.google.email":email});
     if(user === undefined) {
        return true;
     } else {
        if(classes.findOne({_id:classid}).subscribers)
        return false;
     }
}
