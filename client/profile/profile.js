/* jshint esversion: 6 */

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
Session.set("selectedClass",null); // Stores selected owned class info.
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
                template: Template.schoolList
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
                template: Template.teacherList
            }]
        };
    },
    banner() { // Returns banner
        return Session.get("user").banner;
    },
    avatar() { // Returns avatar
        return Session.get("user").avatar;
    },
    username() {  //Returns current user's username
        return Session.get("user").name;
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
    profClassTabColor(status) { // Change this [Supposed to show the current mode that's selected via color]    
        if (Session.equals("profClassTab",status)) {            
            return themeColors[Meteor.user().profile.preferences.theme].highlightText;        
        } else {            
            return;        
        }    
    },
    profClassTab(tab) { // Tells current class
        if (Session.equals("profClassTab",tab)) {
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
        if(Session.equals("selectedClass",null)) return;
        return Session.get("selectedClass")[val];
    },
    code() { // Returns if selected class has code.
        return Session.get("code");
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
        !Session.equals("code",null) &&
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
            document.getElementById("joinPrivClass").style.marginBottom = "-20%";
        }
    },
    // MAIN BUTTONS
    'click .addClass' () { 
        if(Session.equals("profClassTab","addClass")) return;         
        var functionHolder = document.getElementById("profClassInfoHolder");
        closeDivFade(functionHolder);
        var div = document.getElementById("profClasses");
        div.style.height = "50%"
        setTimeout(function() {            
            Session.set("profClassTab", "addClass");
            div.style.height = "90%";          
            openDivFade(functionHolder);        
        }, 400);
    },
    'click .manageClass' () { 
        if(Session.equals("profClassTab","manClass")) return;      
        var functionHolder = document.getElementById("profClassInfoHolder");
        closeDivFade(functionHolder);
        var div = document.getElementById("profClasses");
        div.style.height = "50%"     
        setTimeout(function() {            
            Session.set("profClassTab", "manClass"); 
            div.style.height = "90%";           
            openDivFade(functionHolder);        
        }, 400);
    },
    'click .createClass' () {
        if(Session.equals("profClassTab","creClass")) return;
        var functionHolder = document.getElementById("profClassInfoHolder");        
        closeDivFade(functionHolder);
            var div = document.getElementById("profClasses");
        div.style.height = "50%"
        setTimeout(function() {
            Session.set("profClassTab", "creClass");
            div.style.height = "90%";
            openDivFade(functionHolder);
        }, 400);
    },
    'click .classBox' (event) {  // When you click on a box that holds class
        if (event.target.id === "label" || 
            Session.equals("profClassTab","manClass") || 
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
        Session.set("selectedClass",null);
        var usertype = ["moderators","banned"];
        var array = classes.findOne({_id:attribute});

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

        Meteor.call('getCode',attribute, function(err,result) {
            array.code = result;
            if(result === "None") {
                Session.set("code", false);
            } else {
                Session.set("code", true);
            }

            Session.set("selectedClass",array);
            document.getElementById("createdClasses").style.marginRight = "0";
        });  
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
    // OWNED CLASS BUTTONS
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
            var form = document.getElementsByClassName("creInput");
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
        input.style.width = "55%";
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
        var restrict = ele.getAttribute("restrict");
        if (restrict !== null) {
            input.maxLength = restrict;
            input.className += " restrict";
            Session.set("commentRestrict",restrict-input.value.length.toString() + " characters left");
            var text = document.getElementById(Session.get("modifying")+"restrict");
            text.style.display = "inherit";
            text.style.color = "#7E7E7E";
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
    'keydown input' (event) { // Restricts characters for certain inputs.
        var modifyingInput = Session.get("modifying");
        if (event.keyCode == 13) {
            try {
                closeInput(modifyingInput);
            } catch (err) {}
        }
    },
    'input .restrict' (event) {
        var restrict = event.target.maxLength;
        var chars = restrict - event.target.value.length;
        var text = document.getElementById(Session.get("modifying")+"restrict");
        text.style.color = "#7E7E7E";
        if (chars === restrict) { // Don't display if nothing in comment.
            Session.set("commentRestrict", "");
            return;
        } else if (chars === 0) {
            text.style.color = "#FF1A1A"; // Make text red if 0 characters left.
            text.style.opacity = "0";
        }
        Session.set("commentRestrict", chars.toString() + " characters left");
    },
    'click .profOptionText' (event) { // Click each profile option setting.
        var modifyingInput = Session.get("modifying");
        var p = event.target;
        if(p.className.includes("cre")) {
            var input = p.parentNode.parentNode.childNodes[3];
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
    Session.set("commentRestrict", "");
    try {
       document.getElementById("modifyingInput"+"restrict").style.display = "none";
   } catch(err) {}

    if (input.value === "") {
        span.childNodes[0].nodeValue = "Click here to edit...";
    } else {
        span.childNodes[0].nodeValue = input.value;
    }
    span.style.display = "initial";
    Session.set("modifying", null);
    Session.set("user", getProfileData());
    serverData = Session.get("user");
    sendData("editProfile");
}

function sendData(funcName) {
    Meteor.call(funcName, serverData, function(err, result) {
        if(funcName === "trackUserInClass") {
            var selectedClass = Session.get("selectedClass");
            var array = classes.findOne({_id:selectedClass._id});
            var usertype = ["moderators","banned"];
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
            selectedClass.moderators = array.moderators;
            selectedClass.banned = array.banned;
            Session.set("selectedClass",selectedClass);
        }
    });
}

function getProfileData() { // Gets all data related to profile.
    var profile = Session.get("user");
    profile.description = document.getElementById("motd").childNodes[0].nodeValue;
    profile.school = document.getElementById("school").childNodes[0].nodeValue;
    var gradein = document.getElementById("grade").childNodes[0].nodeValue;
    profile.grade = parseInt(gradein.substring(gradein.length - 2, gradein));
    profile.avatar = document.getElementById("profAvatar").src;
    profile.banner = document.getElementById("profBanner").src;
    profile.preferences = {
        "theme":document.getElementById("prefTheme").childNodes[0].nodeValue.toLowerCase(),
        "mode":document.getElementById("prefMode").childNodes[0].nodeValue.toLowerCase(),
        "timeHide":ref[document.getElementById("prefHide").childNodes[0].nodeValue],
        "done":ref[document.getElementById("prefDone").childNodes[0].nodeValue]
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
