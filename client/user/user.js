/* jshint esversion: 6 */

import {
    Template
} from 'meteor/templating';

Template.user.helpers({
    banner() { // Returns banner
        return this.profile.banner;
    },
    avatar() { // Returns avatar
        return this.services.google.picture;
    },
    username() { // Returns current user's username
        return this.profile.name;
    },
   description() { // Returns the current user's description
        if (this.profile.description) {
            return Meteor.user().profile.description;
        } else {
            return "Unknown";
        }
    },
    school() { // Returns the current user's school's name
        if (this.profile.school) {
            return this.profile.school;
        } else {
            return "Unknown";
        }
    },
    grade() { // Returns the current user's grade
        if (this.profile.grade) {
            return this.profile.grade;
        } else {
            return "Unknown";
        }
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
    Session.set("user", getProfileData());
    serverData = Session.get("user");
    sendData("editProfile");
}

function sendData(funcName) {
    Meteor.call(funcName, serverData);
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
        "theme": document.getElementById("prefTheme").childNodes[0].nodeValue.toLowerCase(),
        "mode": document.getElementById("prefMode").childNodes[0].nodeValue.toLowerCase(),
        "timeHide": ref[document.getElementById("prefHide").childNodes[0].nodeValue],
        "done": ref[document.getElementById("prefDone").childNodes[0].nodeValue]
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
