/* jshint esversion: 6 */
import {
    Template
} from 'meteor/templating';

var openValues = {
    "owned": "-650px",
    "priv": "-160px"
};

confirm = null; // Sets function to execute after confirmation click.

// Sets up global variables

Session.set("profClassTab", "manClass"); // Set default classes card mode to 'Manage Classes.'
Session.set("owned", false); // Status of createdClasses.
Session.set("privClass", false); //Status of joinPrivClass.
Session.set("modifying", null); // Stores current open input.
Session.set("notsearching", true); // If user is searching in search box.
Session.set("autocompleteDivs", null); // Stores returned autocomplete results.
Session.set("confirmText", null); // Stores text for different confirmation functions.
Session.set("selectedClass", null); // Stores selected owned class info.
Session.set("code", null); // If owned class has a code.
Session.set("noclass", null); // If user doesn't have classes.
Session.set("notfound", null); // If no results for autocomplete.

Template.profile.helpers({
/*    themeName() {
        var vals = _.values(themeColors);
        var curtheme = Session.get("user").preferences.theme;
        for (var i = 0; i < vals.length; i++) {
            if (_.isEqual(vals[i], curtheme)) {
                var name = _.keys(themeColors)[i];
                return name.charAt(0).toUpperCase() + name.slice(1);
            }
        }
        return "Custom";
    },*/
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
        return Meteor.user().services.google.picture;
    },
    username() { //Returns current user's username
        return Session.get("user").name;
    },
    description() { // Returns the current user's description
        if (Session.get("user").description !== undefined && Session.get("user").description !== null && Session.get("user").description !== "") return Session.get("user").description;
        return "Say something about yourself!";
    },
    school() { // Returns the current user's school's name
        if (!_.contains([null, undefined, ""], Session.get("user").school)) return Session.get("user").school;
        return "Click here to edit...";
    },
    grade() { // Returns the current user's grade
        if (Session.get("user").grade !== undefined && Session.get("user").grade !== null && Session.get("user").grade !== "") return Session.get("user").grade;
        return "Click here to edit...";
    },
    classes() { // Loads all of the possible classes ( Limit of twenty shown ) ( Sorts by class size ) ( Only your school)
        var array = classes.find({
            status: {
                $eq: true
            },
            privacy: {
                $eq: false
            },
            _id: {
                $nin: Session.get("user").classes
            },
            school: {
                $eq: Session.get("user").school
            }
        }, {
            sort: {
                subscribers: -1
            }
        }, {
            limit: 20
        }).fetch();

        for (var i = 0; i < array.length; i++) {
            array[i].subscribers = array[i].subscribers.length;
        }
        if (array.length === 0) {
            Session.set("noclass", true);
        } else {
            Session.set("noclass", false);
        }
        return array;
    },
    ownedStatus() { // Status of createdClasses
        if (!Session.get("owned")) return openValues.owned;
        return "0px";
    },
    privStatus() {
        if (!Session.get("privClass")) return openValues.priv;
        return "0px";
    },
    profClassTabColor(status) {  // Change this [Supposed to show the current mode that's selected via color]    
        if (Session.equals("profClassTab", status)) {
           return Meteor.user().profile.preferences.theme.modeHighlight;
        } else {
           return;
        }
    },
    profClassTab(tab) { // Tells current class
        if (Session.equals("profClassTab", tab)) {
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
    noclass() { // Returns if user has classes.
        return Session.get("noclass");
    },
    confirmText() { // Returns respective text for different confirm functions.
        return Session.get("confirmText");
    },
    selectedClass(val) { // Returns values for selectedClass
        if (Session.equals("selectedClass", null)) return;
        return Session.get("selectedClass")[val];
    },
    code() { // Returns if selected class has code.
        return Session.get("code");
    }
});

Template.profile.events({
    'click' (event) { // Whenever a click happens'
        var e = event.target.className;
        if(modifyingInput !== null && event.target !== document.getElementById(modifyingInput)) {
            if (!(e.includes("optionHolder") || e.includes("optionText"))) {
                if(document.getElementById(modifyingInput).className.includes("dropdown")) {
                    $(".optionHolder")
                    .fadeOut(250, "linear");

                    $(".selectedOption").removeClass("selectedOption");
                } else {
                    if(modifyingInput === "description") {
                        Session.set("restrictText", {});
                        $("#"+modifyingInput).css('cursor','pointer');
                        var newSetting = Session.get("user");
                        newSetting[modifyingInput] = document.getElementById(modifyingInput).value;
                        serverData = newSetting;
                        sendData("editProfile");
                    } 
                }
                modifyingInput = null;
            }
        }

        if (!document.getElementById("createdClasses").contains(event.target) &&
            !Session.equals("code", null) &&
            !event.target.className.includes("fa-times-circle-o")) {
            Session.set("owned", false);
        }
        if (Session.get("changeAdmin") &&
            !document.getElementById("changeAdmin").contains(event.target)) {
            Session.set("changeAdmin", false);
            var div = document.getElementById("changeAdmin");
            div.removeChild(div.childNodes[3]);
            div.removeChild(div.childNodes[3]);
        }
        if (Session.get("privClass") &&
            !(event.target.id === "private") &&
            !document.getElementById("joinPrivClass").contains(event.target)) {
            Session.set("privClass", false);
        }
    },
    // MAIN BUTTONS
    'click #mainpage' () {
        if (!Meteor.userId() || _.contains([null, undefined, ""], Meteor.user().profile.school)) {
            sAlert.closeAll();
            sAlert.error('Please fill in your profile!', {effect: 'stackslide', position: 'top'});
        } else {
            window.location = '/';
        }
    },
    'click .addClass' () { 
        if (Session.equals("profClassTab", "addClass")) return;         
        var functionHolder = document.getElementById("profClassInfoHolder");
        closeDivFade(functionHolder);
        var div = document.getElementById("profClasses");
        div.style.height = "50%";
        setTimeout(function() {            
        Session.set("profClassTab", "addClass");
            div.style.height = "70%";          
            openDivFade(functionHolder);        
        }, 400);
     },
    'click .manageClass' () { 
        if (Session.equals("profClassTab", "manClass")) return;      
        var functionHolder = document.getElementById("profClassInfoHolder");
        closeDivFade(functionHolder);
        var div = document.getElementById("profClasses");
        div.style.height = "50%";     
        setTimeout(function() {            
            Session.set("profClassTab", "manClass"); 
            div.style.height = "70%";           
            openDivFade(functionHolder);        
        }, 400);
    },
    'click .createClass' () {
        if (Session.equals("profClassTab", "creClass")) return;
        var functionHolder = document.getElementById("profClassInfoHolder");        
        closeDivFade(functionHolder);
        var div = document.getElementById("profClasses");
        div.style.height = "50%";
        setTimeout(function() {
                Session.set("profClassTab", "creClass");
                div.style.height = "70%";
                openDivFade(functionHolder);
        }, 400);
    },
    'click .classBox' (event) { // When you click on a box that holds class
        if (event.target.id === "label" ||
            Session.equals("profClassTab", "manClass") ||
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
        if(attribute === Meteor.userId()) return;
        Session.set("selectedClass", null);
        var usertype = ["moderators", "banned"];
        var array = classes.findOne({
            _id: attribute
        });

        for (var i = 0; i < usertype.length; i++) {
            var users = array[usertype[i]];
            array[usertype[i]] = [];
            for (var j = 0; j < users.length; j++) {
                var detailusers = {};
                var user = Meteor.users.findOne({
                    _id: users[j]
                });
                detailusers._id = user._id;
                detailusers.email = user.services.google.email;
                detailusers.name = user.profile.name;
                array[usertype[i]].push(detailusers);
            }
        }

        Meteor.call('getCode', attribute, function(err, result) {
            array.code = result;
            if (result === "None") {
                Session.set("code", false);
            } else {
                Session.set("code", true);
            }

            Session.set("selectedClass", array);
            Session.set("owned", true);
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
        if (Session.get("privClass")) return;
        var input = document.getElementById("privateCode");
        input.className = "";
        input.placeholder = "Enter code here...";
        Session.set("privClass", true);
    },
    'click #privSubmit' () { // Submits private class code
        var input = document.getElementById("privateCode");
        var code = input.value;
        input.value = "";
        serverData = code;
        Meteor.call("joinPrivateClass", code, function(error, result) {
            if (result) {
                Session.set("privClass", false);
            } else {
                input.className = "formInvalid";
                input.placeholder = "Invalid code.";
            }
        });
    },
    // OWNED CLASS BUTTONS
    'click #copy' () { // Copies code for private classes.
        if (document.getElementById("code").value === "None") return;
        document.getElementById("code").select();
        document.execCommand("copy");
    },
    'click .userAdder .fa-plus' (event) { // Gives/Removes user privileges
        var input = event.target.parentNode.childNodes[3];
        input.placeholder = "1234@abc.xyz";
        input.className.replace(" formInvalid", "");
        var value = input.value;
        var classid = document.getElementById("createdClasses").getAttribute("classid");
        input.value = " ";
        if (checkUser(value, classid)) {
            input.className += " formInvalid";
            input.placeholder = "Not a valid user";
            return;
        }
        var user = Meteor.users.findOne({
            "services.google.email": value
        });
        serverData = [
            user._id,
            classid,
            event.target.parentNode.childNodes[1].childNodes[0].nodeValue.replace(":", "").toLowerCase(),
            true
        ];
        sendData("trackUserInClass");
    },
    'click .userBox .fa-times' (event) { // Removes user from permissions
        var box = event.target.parentNode;
        serverData = [
            box.getAttribute("userid"),
            document.getElementById("createdClasses").getAttribute("classid"),
            box.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[0].nodeValue.replace(":", "").toLowerCase(),
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
        if (Session.get("changeAdmin")) return;
        Session.set("changeAdmin", true);
        var input = document.createElement("input");
        input.placeholder = "1234@abc.xyz";
        var i = document.createElement("i");
        i.className = "fa fa-exchange";
        i.setAttribute("aria-hidden", "true");
        event.target.parentNode.appendChild(input);
        event.target.parentNode.appendChild(i);
    },
    'click .fa-exchange' (event) { //Changes class admin upon confirmation
        var input = event.target.parentNode.childNodes[3];
        input.placeholder = "1234@abc.xyz";
        input.className.replace(" formInvalid", "");
        var value = input.value;
        var classid = document.getElementById("createdClasses").getAttribute("classid");
        input.value = "";
        if (checkUser(value, classid)) {
            input.className += " formInvalid";
            input.placeholder = "Not a valid user";
            return;
        }
        var user = Meteor.users.findOne({
            "services.google.email": value
        });
        serverData = [user._id, classid];
        confirm = "changeAdmin";
        Session.set("confirmText", "Are you really sure?");
        openDivFade(document.getElementsByClassName("overlay")[0]);
        document.getElementById("createdClasses").style.marginRight = "-40%";
    },
    // OVERLAY BUTTONS
    'click .fa-check-circle-o' () { // Confirmation Button
        sendData(confirm);
        closeDivFade(document.getElementsByClassName("overlay")[0]);
        if (confirm === "createClass") {
            var form = document.getElementsByClassName("creInput");
            for (var i = 0; i < form.length; i++) form[i].value = "";
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
    'focus .clickModify' (event) {
        $(".optionHolder")
        .fadeOut(250, "linear");

        if(modifyingInput !== null) {
            if(!$("#"+modifyingInput)[0].className.includes("dropdown")) closeInput(modifyingInput);
        } 
        modifyingInput = event.target.id;
        if(!$("#"+modifyingInput)[0].className.includes("dropdown")) {
            event.target.select();
            event.target.style.cursor = "text";   
        }
    },
    'keydown .dropdown' (event) {
        event.preventDefault();
        var first = $("#"+modifyingInput).next().children("p:first-child");
        var last = $("#"+modifyingInput).next().children("p:last-child"); 
        var next = $(".selectedOption").next();
        var prev = $(".selectedOption").prev();
        var lastSel = $(".selectedOption");

        if (event.keyCode === 38) {
            event.preventDefault();
            if (lastSel === undefined) {
                last.addClass("selectedOption");
            } else {
                if (prev.length === 0) {
                    last.addClass("selectedOption");
                    lastSel.removeClass("selectedOption");  
                } else {
                    prev.addClass("selectedOption");
                    lastSel.removeClass("selectedOption");
                }
            }
        } else if (event.keyCode === 40) {
            event.preventDefault();
            if (lastSel === undefined) {
                first.addClass("selectedOption");
                last.removeClass("selectedOption");
            } else {
                if (next.length === 0) {
                    first.addClass("selectedOption");
                    lastSel.removeClass("selectedOption");
                } else {
                    next.addClass("selectedOption");
                    lastSel.removeClass("selectedOption");
                }
            }    
        } else if (event.keyCode === 13) {
            lastSel[0].click();
        }
    },
    'focus .dropdown' (event) {
        $(".selectedOption").removeClass("selectedOption");

        $("#" + modifyingInput).next()
        .css('opacity',0)
        .slideDown(300)
        .animate(
            { opacity: 1 },
            { queue: false, duration: 100 }
        );
    },
    'click .optionText' (event) { // Click each preferences setting.
        var option = event.target.childNodes[0].nodeValue;
        var userSettings = ["description","school","grade"];
        var newSetting = Session.get("user");
        
        if(modifyingInput === "privacy" || modifyingInput === "category") {
            document.getElementById(modifyingInput).value = option;
            $("#" + modifyingInput).next()
            .fadeOut(250, "linear");
            $(".selectedOption").removeClass("selectedOption");
            return;
        }

        if(_.contains(userSettings, modifyingInput)) {
            newSetting[modifyingInput] = (modifyingInput === "grade") ? parseInt(option) : option;
        } else {
            newSetting.preferences[modifyingInput] = (function() {
                var value = options[modifyingInput].filter(function(entry) {
                    return option === entry.alias;
                })[0].val;
                return (modifyingInput === 'theme') ? themeColors[value] : value;
            })();
        }
        Session.set("user", newSetting);
        serverData = Session.get("user");
        sendData("editProfile"); 

        $("#" + modifyingInput).next()
        .fadeOut(250, "linear");

        $(".selectedOption").removeClass("selectedOption");
    },
    'input .restrict' (event) {
        var restrict = event.target.maxLength;
        var chars = restrict - event.target.value.length;
        var newSetting = Session.get("restrictText");
        newSetting[event.target.id] = (chars === restrict) ? "" : (chars.toString() + ((chars === 1) ? " character " : " characters ") + "left");
        newSetting.selected = event.target.id;
        Session.set("restrictText", newSetting);
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
                if (Meteor.user().profile.classes.indexOf(item.getAttribute("classid")) !== -1) continue;
                divs.push({
                    name: item.childNodes[1].childNodes[0].nodeValue,
                    teacher: item.childNodes[3].childNodes[0].nodeValue,
                    hour: item.childNodes[5].childNodes[0].nodeValue,
                    subscribers: item.childNodes[7].childNodes[0].nodeValue.length / 17,
                    _id: item.getAttribute("classid")
                });
                Session.set("autocompleteDivs", divs);
            }
        } catch (err) {}
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

function sendData(funcName) {
    Meteor.call(funcName, serverData, function(err, result) {
        if (funcName === "trackUserInClass") {
            var selectedClass = Session.get("selectedClass");
            var array = classes.findOne({
                _id: selectedClass._id
            });
            var usertype = ["moderators", "banned"];
            for (var i = 0; i < usertype.length; i++) {
                var users = array[usertype[i]];
                array[usertype[i]] = [];
                for (var j = 0; j < users.length; j++) {
                    var detailusers = {};
                    var user = Meteor.users.findOne({
                        _id: users[j]
                    });
                    detailusers._id = user._id;
                    detailusers.email = user.services.google.email;
                    detailusers.name = user.profile.name;
                    array[usertype[i]].push(detailusers);
                }
            }
            selectedClass.moderators = array.moderators;
            selectedClass.banned = array.banned;
            Session.set("selectedClass", selectedClass);
        }
    });
}

function getProfileData() { // Gets all data related to profile.
    var profile = Session.get("user");

    profile.description = document.getElementById("motd").childNodes[0].nodeValue;
    if (profile.description.includes("Say something about yourself!")) profile.description = "";

    profile.school = document.getElementById("school").childNodes[0].nodeValue;
    if (profile.school === "Click here to edit...") profile.school = "";

    var gradein = document.getElementById("grade").childNodes[0].nodeValue;
    profile.grade = parseInt(gradein.substring(gradein.length - 2, gradein));
    if (!profile.grade) profile.grade = "";

    profile.avatar = document.getElementById("profAvatar").src;
    profile.banner = document.getElementById("profBanner").src;

    var themename = document.getElementById("prefTheme").childNodes[0].nodeValue.toLowerCase();
    var themeobj = themeColors[themename];
    profile.preferences = {
        "theme": themeobj,
        "mode": document.getElementById("prefMode").childNodes[0].nodeValue.toLowerCase(),
        "timeHide": ref[document.getElementById("prefHide").childNodes[0].nodeValue],
        "done": ref[document.getElementById("prefDone").childNodes[0].nodeValue],
        "hideReport": ref[document.getElementById("prefReport").childNodes[0].nodeValue]
    };
    return profile;
}

function getCreateFormData() { // Gets create class form data, and returns null.
    var stop;
    var form = document.getElementsByClassName("creInput");
    for (var i = 0; i < form.length; i++) { // Checks for missing/invalid fields.
        if (i === 1 || i === 2) continue;
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

function checkUser(email, classid) { // Checks if user email exists.
    var user = Meteor.users.findOne({
        "services.google.email": email
    });
    if (user === undefined) {
        return true;
    } else {
        if (classes.findOne({
            _id: classid
        }).subscribers)
            return false;
    }
}
