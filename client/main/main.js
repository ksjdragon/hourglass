import {
    Template
} from 'meteor/templating';

import './main.html';

var openValues = {
    "menu": "-25%",
    "options": "-20%"
};

var themeColors = {
    "light": {
        "background": "White.jpg",
        "header": "#EBEBEB",
        "sidebar": "#65839A",
        "statusIcons": "#33ADFF",
        "highlightText": "#FF1A1A",
        "cards": "#FEFEFE"
    },
    "dark": {

    }
};

var calendarColors = {
    "test": "red",
    "project": "blue",
    "normal": "green",
    "quiz": "black"
};

var options = {
    "privacy": ["Public", "Hidden"],
    "category": ["Class", "Club", "Other"]
};

var searchSchools = [];

Session.set("sidebar", null);
Session.set("mode", null); // Change to user preferences

Template.registerHelper('divColor', (div) => {
    return themeColors[Cookie.get("theme")][div];
});

Template.registerHelper('overlayDim', (part) => {
    var dim = [window.innerWidth * .2, window.innerHeight * 0.2];
    var width = "width:" + dim[0].toString() + "px;";
    var height = "height:" + dim[1].toString() + "px;";
    var margin = "margin-left:" + (-dim[0] / 2).toString() + "px;";
    var bg = "background-color:" + themeColors[Cookie.get("theme")].header + ";";
    return width + height + margin + bg;
});

Template.main.helpers({
    schoolName() {
        return " - " + Meteor.user().profile.school;
    },
    iconColor(icon) {
        if (Session.get("sidebar") === icon + "Container") {
            return themeColors[Cookie.get("theme")].statusIcons;
        } else if (Session.get("sidebar") === "both") {
            return themeColors[Cookie.get("theme")].statusIcons;
        } else {
            return;
        }
    },
    bgSrc() {
        var dim = [window.innerWidth, window.innerHeight];
        var pic = themeColors[Cookie.get("theme")].background;
        return pic;
    },
    menuStatus() {
        if (Session.get("sidebar") === "menuContainer") {
            return "0%";
        } else if (Session.get("sidebar") === "both") {
            return "0%";
        } else {
            return openValues.menu;
        }
    },
    optionsStatus() {
        if (Session.get("sidebar") === "optionsContainer") {
            return "0%";
        } else if (Session.get("sidebar") === "both") {
            return "0%";
        } else {
            return openValues.options;
        }
    },
    modeStatus(status) {
        if (status === Session.get("mode")) {
            return themeColors[Cookie.get("theme")].highlightText;
        } else {
            return;
        }
    },
    currMode(name) {
        if (name === Session.get("mode")) {
            return true;
        } else {
            return false;
        }
    },
    calendarOptions() {
        var events = [];
        userclasses = Meteor.user().profile.classes;
        var cursor = work.find({class: {$in: userclasses}});
        cursor.forEach(function(current) {
            backgroundColor = calendarColors[current.type];
            title = current.name;
            duedate = current.dueDate.toISOString().slice(0, 10);
            events.push({
                start: duedate,
                title: title,
                backgroundColor: backgroundColor
            });
        });
        return {
            height: window.innerHeight * .8,
            events: events,
            buttonText: {
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day'
            }
        };
    },
    calCenter() {
        var width = window.innerWidth * 0.85;
        return "width:" + width.toString() + "px;margin-left:" + (0.5 * window.innerWidth - 0.5 * width).toString() + "px";
    },
    calbg() {
        var width = window.innerWidth * 0.865;
        var height = window.innerHeight * 0.76;
        return "width:" + width.toString() + "px;height:" + height.toString() + "px;margin-left:" + (0.5 * window.innerWidth - 0.5 * width).toString() + "px;margin-top:" + (0.47 * window.innerHeight - 0.5 * height).toString() + "px";
    }
});

Template.main.events({
    'click .fa-bars' () {
        var side = Session.get("sidebar");
        if (side === "menuContainer") {
            Session.set("sidebar", null);
        } else if (side === "optionsContainer") {
            Session.set("sidebar", "both");
        } else if (side === "both") {
            Session.set("sidebar", "optionsContainer");
        } else {
            Session.set("sidebar", "menuContainer");
        }
    },
    'click .fa-cog' () {
        var side = Session.get("sidebar");
        if (side === "optionsContainer") {
            Session.set("sidebar", null);
        } else if (side === "menuContainer") {
            Session.set("sidebar", "both");
        } else if (side === "both") {
            Session.set("sidebar", "menuContainer");
        } else {
            Session.set("sidebar", "optionsContainer");
        }
    },
    'click .classes' () {
        if (Session.get("mode") === "classes") return;
        var modeHolder = document.getElementById("mainBody");
        closeDivFade(modeHolder);
        setTimeout(function() {
            Session.set("mode", "classes");
            openDivFade(modeHolder);
        }, 300);
    },
    'click .calendar' () {
        if (Session.get("mode") === "calendar") return;
        var modeHolder = document.getElementById("mainBody");
        closeDivFade(modeHolder);
        setTimeout(function() {
            Session.set("mode", "calendar");
            openDivFade(modeHolder);
        }, 300);
    },
    'click' (event) {
        var e = event.target.className;
        if (e !== Session.get("sidebar") &&
            !e.includes("fa-cog") &&
            !e.includes("fa-bars") &&
            !document.getElementById("menuContainer").contains(event.target) &&
            !document.getElementById("optionsContainer").contains(event.target)) {
            Session.set("sidebar", null);
        }
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
