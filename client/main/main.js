/* jshint esversion: 6 */
import {
    Template
} from 'meteor/templating';

import './main.html';

var load = true;
var calWorkOpen = null;
var calWorkDate = null;

var openValues = {
    "menu": "-270px",
    "options": "-300px",
    "requests": "-235px"
};

// Sets colors for different assignment statuses
var workColors = {
    "normal": "#2E4F74",
    "quiz": "#409333",
    "test": "#AD3C44",
    "project": "#D8831A",
    "other": "#852E6D"
};

var defaultWork = {
    name: "Name | Click here to edit...",
    dueDate: "Click here to edit...",
    description: "Click here to edit...",
    type: "Click here to edit..."
};

// Creates variables for due dates

var ref = {
    "1 Day": 1,
    "2 Days": 2,
    "1 Week": 7,
    "1 Month": 30,
    "Never": 0,
    "Yes": true,
    "No": false
};

// Reactive variables.
Session.set("user",{}); // Stores user preferences.
Session.set("calendarClasses", []); // Stores calendar classes.
Session.set("sidebar", null); // Status of sidebar.
Session.set("requests",false); // Status of requests.
Session.set("newWork", null); // If user creating new work.
Session.set("currentWorkId",null); // Stores current work Id.
Session.set("currentReadableWork", null); // Stores readable selected work info.
Session.set("modifying", null); // Stores current open input.
Session.set("noclass", null); // If user does not have classes.
Session.set("calCreWork", null); // If user is creating a work from calendar.
Session.set("classDisp", []); // Stores current filter for classes.
Session.set("typeFilter", []); // Stores type filters for classes.
Session.set("typeFilterHover",null); // Stores current hovered type filter.
Session.set("classDispHover", null); // Stores current hovered class filter.
Session.set("refetchEvents", null); // Stores whether to get calendar events again.
Session.set("commentRestrict", ""); // Stores text for comment character restriction.

Template.login.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
};

Template.main.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
    dragula([document.querySelector('#classesMode'), document.querySelector('#nonexistant')]);
};

Template.profile.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
};

Template.registerHelper('userProfile', () => {
    if(Meteor.user() === undefined || Meteor.user() === null) return;
    Session.set("user", Meteor.user().profile);
    return;
});

Template.registerHelper('screen', (multiplier, fraction) => {
    if(typeof multiplier !== "string") return screen.width.toString() + "px";
    if(typeof fraction !== "string") return (screen.width * parseFloat(multiplier)).toString() + "px";
    return ((screen.width) * parseFloat(multiplier) / parseFloat(fraction)).toString() + "px";
});

Template.registerHelper('divColor', (div) => { // Reactive color changing based on preferences. Colors stored in themeColors.
    return themeColors[Session.get("user").preferences.theme][div];
});

Template.registerHelper('textColor', () => { // Reactive color for text.
    document.getElementsByTagName("body")[0].style.color = themeColors[Session.get("user").preferences.theme].text;
    return;
});

Template.registerHelper('overlayDim', (part) => { // Gets size of the overlay container.
    var dim = [window.innerWidth * 0.25, window.innerHeight * 0.2];
    var width = "width:" + dim[0].toString() + "px;";
    var height = "height:" + dim[1].toString() + "px;";
    var margin = "margin-left:" + (-dim[0] / 2).toString() + "px;";
    var bg = "background-color:" + themeColors[Session.get("user").preferences.theme].header + ";";
    return width + height + margin + bg;
});

Template.registerHelper('myClasses', () => { // Gets all classes and respective works.
    if(Session.get("user").classes.length === 0) { // Null checking.
        Session.set("noclass",true); // Makes sure to display nothing.
        return [];
    } else {
        var array = [];
        var refetch = true;
        var courses = Session.get("user").classes;
        var classDisp = Session.get("classDisp"); // Get sidebar class filter.
        var sideFilter = Session.get("typeFilter"); // Get sidebar type filter.
        var hide = Session.get("user").preferences.timeHide;

        for (var i = 0; i < courses.length; i++) { // For each user class.
            if (courses[i] === Meteor.userId()) {
                found = {
                    _id: courses[i],
                    name: "Personal",
                    subscribers: 1,
                    mine: false,
                    box: " owned"
                };
            } else {
                found = classes.findOne({
                    _id: courses[i]
                });
                found.subscribers = found.subscribers.length;
                found.mine = true;
                if (found.admin === Meteor.userId()) { // If user owns this class.
                    found.box = " owned";
                    found.mine = false;
                }
            }
            if (classDisp.indexOf(courses[i]) !== -1) found.selected = true; // Filter selected.
            array.push(found);

            var thisWork = work.find({
                class: courses[i]
            }).fetch();

            if (classDisp.length !== 0 && classDisp.indexOf(found._id) === -1) { // Filter classes based on filter.
                array[i].thisClassWork = [];
                continue;
            }

            for (var j = 0; j < thisWork.length; j++) { // For each work in class.
                if (hide !== 0) { // Time to hide isn't never.
                    var due = (moment(thisWork[j].dueDate))._d;
                    var offset = (moment().subtract(hide, 'days'))._d;
                    if (offset > due) { // If due is before hide days before today
                        thisWork[j] = "no";
                    }
                }

                if (thisWork[j] !== "no" && Session.get("user").preferences.done) { // If done filter is true
                    if (thisWork[j].done.indexOf(Meteor.userId()) !== -1) { // If user marked this work done.
                        thisWork[j] = "no";
                    }
                }

                if (thisWork[j] !== "no" && sideFilter.length !== 0 && !_.contains(sideFilter, thisWork[j].type)) {
                    thisWork[j] = "no"
                }

                if(thisWork[j] !== "no" && Session.get("user").preferences.hideReport && (thisWork[j].confirmations.length/thisWork[j].reports.length) <= 0.9) {
                    thisWork[j] = "no";
                }

            }
            while (thisWork.indexOf("no") !== -1) thisWork.splice(thisWork.indexOf("no"), 1); // Splice all filtered works.

            for (j = 0; j < thisWork.length; j++) {
                thisWork[j].classid = courses[i];
                thisWork[j].realDate = thisWork[j].dueDate;
                thisWork[j].dueDate = moment(thisWork[j].dueDate).calendar(null, {
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    nextWeek: 'dddd',
                    lastDay: '[Yesterday]',
                    lastWeek: '[Last] dddd',
                    sameElse: 'MMMM Do'
                });

                if (thisWork[j].dueDate === "Today") { // Font weight based on date proximity.
                    thisWork[j].cardDate = "600";
                } else if (thisWork[j].dueDate === "Tomorrow") {
                    thisWork[j].cardDate = "400";
                }
                thisWork[j].typeColor = workColors[thisWork[j].type];

                thisWork[j].confirmationLength = thisWork[j].confirmations.length; // Counts the number of confirmations and reports for a particular work.
                thisWork[j].reportLength = thisWork[j].reports.length;

                thisWork[j].creator = Meteor.users.findOne({_id: thisWork[j].creator}).profile.name;
                var conf = thisWork[j].confirmations.length;
                var repo = thisWork[j].reports.length;
                var ratio = conf / repo;
                var normalColor = themeColors[Session.get("user").preferences.theme]["text"];
                if (Math.abs(conf - repo)) {
                    if ((conf+repo) <= 1) {
                        thisWork[j].doneRatio = normalColor;
                    } else {
                        thisWork[j].doneRatio = "#F9F906";
                    } 
                } else if (ratio >= 2) {
                    thisWork[j].doneRatio = "#33DD33";
                } else if (ratio <= .9) {
                    thisWork[j].doneRatio = "#FF1A1A";
                }
            }
            array[i].thisClassWork = thisWork.sort(function(a, b) {
                return Date.parse(a.realDate) - Date.parse(b.realDate);
            });
        }
        Session.set("noclass", false);
        Session.set("calendarClasses", array);
        Session.set("refetchEvents", refetch);
        return array;
    }
});

Template.registerHelper('pref', (val) => { // Obtains all user preferences.
    var preferences = Session.get("user").preferences;
    if(val === 'timeHide' || val === 'done' || val == 'hideReport') {
        var invert = _.invert(ref);
        return invert[preferences[val]];
    }
    return preferences[val].charAt(0).toUpperCase() + preferences[val].slice(1);
});

Template.registerHelper('commentLength', () => { // Returns characters left for comment length.
    return Session.get("commentRestrict");
});

Template.main.helpers({
    schoolName() { // Finds the name of the user's school.
        if(Session.get("user").school === undefined) return;
        return " - " + Session.get("user").school;
    },
    iconColor(icon) { // Sidebar status color
        if (Session.equals("sidebar",icon + "Container")) {
            return themeColors[Session.get("user").preferences.theme].statusIcons;
        } else if (Session.equals("sidebar","both")) {
            return themeColors[Session.get("user").preferences.theme].statusIcons;
        } else {
            return;
        }
    },
    avatar() { // Returns avatar.
        return Session.get("user").avatar;
    },
    username() { // Returns user name.
        return Session.get("user").name;
    },
    defaultMode() { //Loads the default display mode for user.
        if(load) Session.set("mode",Session.get("user").preferences.mode);
        load = false;
        return;
    },
    bgSrc() { // Returns background.
        return "Backgrounds/"+ themeColors[Session.get("user").preferences.theme].background;
    },
    menuStatus() { // Status of of menu sidebar.
        if (Session.equals("sidebar", "menuContainer")) {
            return "0px";
        } else if (Session.equals("sidebar", "both")) {
            return "0px";
        } else {
            return openValues.menu;
        }
    },
    optionsStatus() { // Status of options sidebar.
        if (Session.equals("sidebar", "optionsContainer")) {
            return "0px";
        } else if (Session.equals("sidebar", "both")) {
            return "0px";
        } else {
            return openValues.options;
        }
    },
    requestStatus() {
        if (Session.get("requests")) return "0px";
        return openValues.requests;
    },
    modeStatus(status) { // Color status of display modes.
        if (!Session.equals("mode",status)) return;
        return themeColors[Session.get("user").preferences.theme].highlightText;
    },
    currMode(name) { // Status of display mode.
        return Session.equals("mode",name);
    },
    calendarOptions() { // Settings for the calendar, including work displaying.
        return {
            id: "fullcalendar",
            height: window.innerHeight * 0.8,
            buttonText: {
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day'
            },
            eventLimit: 3,
            events: function(start, end, timezone, callback) {
                var events = [];
                var userClasses = Session.get("calendarClasses");

                for (var i = 0; i < userClasses.length; i++) {
                    var works = userClasses[i].thisClassWork;
                    for (var j = 0; j < works.length; j++) {
                        var work = works[j];
                        var currClass = classes.findOne({
                            _id: work.class
                        });
                        var inRole = false;

                        if (work.class === Meteor.userId() ||
                            Meteor.userId() === work.creator ||
                            Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                            currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
                            currClass.banned.indexOf(Meteor.userId()) !== -1
                        ) inRole = true;
                        events.push({
                            id: work._id,
                            start: work.realDate.toISOString().slice(0, 10),
                            title: work.name,
                            backgroundColor: workColors[work.type],
                            borderColor: "#444",
                            startEditable: inRole,
                            className: work.type + " workevent " + work.class
                        });
                    }
                }
                callback(events);
            },
            eventDrop: function(event, delta, revertFunc) { // When user drops from click-dragging.
                var current = work.findOne({
                    _id: event.id
                });
                var date = event.start.format().split("-");
                current.dueDate = new Date(date[0], parseInt(date[1]) - 1, date[2], 11, 59, 59);
                serverData = current;
                sendData("editWork");
            },
            eventClick: function(event, jsEvent, view) { // On-click for work.
                Session.set("newWork", false);
                Session.set("currentWorkId", event.id);
                openDivFade(document.getElementsByClassName("overlay")[0]);
            },
            eventMouseover: function (event, jsEvent, view) {
                this.style.boxShadow = "inset 0 0 0 99999px rgba(255,255,255,0.2)";
            },
            eventMouseout: function (event, jsEvent, view) {
                this.style.boxShadow = "";
            },
            dayClick: function(date, jsEvent, view) { // On-click for each day.
                if (jsEvent.target.className.includes("fc-past") || Session.get("noclass")) return;
                Session.set("calCreWork", true);
                calWorkDate = date.format();
                calWorkOpen = true;
                Session.set("newWork", true);
                Session.set("sidebar", "menuContainer");
            }
        };
    },
    calCenter() { // Centers the calendar
        var width = window.innerWidth * 0.85;
        return "width:" + width.toString() + "px;margin-left:" + (0.5 * window.innerWidth - 0.5 * width).toString() + "px;";
    },
    calColor() { // Sets the color of the calendar according to theme
        return "color:"+themeColors[Session.get("user").preferences.theme].calendar;
    },
    calCreWork() { // Display instructions for creating a work.
        if (Session.get("calCreWork")) return true;
        return false;
    },
    filterOn() {
        if (Session.get("classDisp").length !== 0) return true;
        return false;
    },
    highlight() { // Calendar highlight/scale option.
        var hoverHighlight = Session.get("classDispHover");
        var typeHighlight = Session.get("typeFilterHover");
        if(Session.equals("mode","classes")) {
            $(".workCard").toggleClass("scaled",false);
            try {
                $(".workCard[classid=\'"+hoverHighlight+"\']").toggleClass("scaled",true);
                $(".workCard[type=\'"+typeHighlight+"\']").toggleClass("scaled",true);
            } catch(err) {}
        } else {
            $(".workevent").toggleClass("scaled",false);
            try {
                $("."+hoverHighlight).toggleClass("scaled",true);
                $("."+typeHighlight).toggleClass("scaled",true);
            } catch(err) {}
        }
        return;
    },
    work(value) { // Returns the specified work value.
        if (Session.equals("currentWorkId", null)) return;
        if (Session.get("newWork")) {
            return defaultWork[value]; 
        } else {
            var thisWork = work.findOne({_id: Session.get("currentWorkId")});
            return formReadable(thisWork,value);
        }
    },
    newWork() { // If user is creating a new work.
        return Session.get("newWork");
    },
    types() {
        var types = Object.keys(workColors);
        var array = [];
        for(var i = 0; i < types.length; i++) {
            array.push({ 
                "type": types[i],
                "typeName": types[i][0].toUpperCase() + types[i].slice(1),
                "selected": _.contains(Session.get("typeFilter"), types[i])
            });
        }
        return array;
    },
    inRole() { // Checks correct permissions.
        var thisWork = work.findOne({
            _id: Session.get("currentWorkId")
        });
        if (Session.get("newWork")) {
            return true;
        } else {
            if (thisWork === undefined) return;
            var currClass = classes.findOne({
                _id: thisWork["class"]
            });
            if (Meteor.userId() === thisWork.creator ||
                Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
                currClass.banned.indexOf(Meteor.userId()) !== -1
            ) return true;
        }
    },
    admin() {
        return Roles.userIsInRole(Meteor.userId(), ['admin', 'superadmin']);
    },
    refetchEvents() {
        if (Session.get("refetchEvents")) {
            $("#fullcalendar").fullCalendar('refetchEvents');
            Session.set("refetchEvents", null);
        }
    }
});

Template.main.events({
    'click' (event) { // Closes respective divs when clicking outside of them. Order matters.
        var e = event.target.className;
        var modifyingInput = Session.get("modifying");

        if (event.target.id !== modifyingInput && // Input for dropdown closing.
            event.target.id !== modifyingInput + "a" &&
            !Session.equals("modifying", null) &&
            !event.target.parentNode.className.includes("workOptions") &&
            !event.target.parentNode.className.includes("prefOptions")) {
            closeInput(modifyingInput);
        }

        if (!Session.equals("sidebar", e) && // Sidebar closing.
            !e.includes("fa-cog") &&
            !e.includes("fa-bars") &&
            !document.getElementById("menuContainer").contains(event.target) &&
            !document.getElementById("optionsContainer").contains(event.target)) {
            if (Session.get("calCreWork")) {
                if (!calWorkOpen) {
                    Session.set("calCreWork", false);
                    Session.set("sidebar", null);
                }
                calWorkOpen = false;
            } else {
                Session.set("sidebar", null);
            }
        }

        if (e === "overlay") { // Overlay closing.
            closeDivFade(document.getElementsByClassName("overlay")[0]);
            if (!Session.get("newWork")) {
                document.getElementById("workComment").value = "";
            }
            Session.set("newWork", null);
            $('.req').css("color", "");
            Session.set("commentRestrict", null);
        }

        if (!event.target.className.includes("radio") && // Dropdown closing.
            !event.target.parentNode.className.includes("workOptions") &&
            !event.target.parentNode.className.includes("prefOptions") &&
            event.target.readOnly !== true) {
            var radio;
            if (Session.equals("sidebar", "optionsContainer") || Session.equals("sidebar", "both")) {
                radio = "prefOptions";
            } else {
                radio = "workOptions";
            }
            for (var i = 0; i < document.getElementsByClassName(radio).length; i++) {
                try {
                    closeDivFade(document.getElementsByClassName(radio)[i]);
                } catch (err) {}
            }
        }

        if(!document.getElementById("userDropdown").contains(event.target)) closeDivFade(document.getElementById("userDropdown"));
        if(!document.getElementById("requests").contains(event.target)) Session.set("requests",false);
    },
    // MAIN MENU BUTTONS
    'click .fa-bars' () { // Click menu button.
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
    'click .fa-cog' () { // Click settings button.
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
    'click #requests .fa-question' () {
        Session.set("requests",!Session.get("requests"));
    },
    'click .classes' () { // Click classes mode button.
        if (Session.equals("mode", "classes")) return;
        var modeHolder = document.getElementById("mainBody");
        closeDivFade(modeHolder);
        setTimeout(function() {
            Session.set("mode", "classes");
            openDivFade(modeHolder);
        }, 300);
        Session.set("sidebar", null); // Closes all sidebars.
        Session.set("calCreWork", null);
    },
    'click .calendar' () { // Click calendar mode button.
        if (Session.equals("mode", "calendar")) return;
        var modeHolder = document.getElementById("mainBody");
        closeDivFade(modeHolder);
        setTimeout(function() {
            Session.set("mode", "calendar");
            openDivFade(modeHolder);
        }, 300);
        Session.set("sidebar", null); // Closes all sidebars.
        Session.set("calCreWork", null);
    },
    'click .creWork' (event) { // Cick add work button.
        var attr;
        if (event.target.className !== "creWork") {
            attr = event.target.parentNode.getAttribute("classid");
        } else {
            attr = event.target.getAttribute("classid");
        }
        Session.set("newWork", true);
        Session.set("currentWorkId",attr);
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #dropdown' (event) {
        if(document.getElementById("userDropdown").style.display === "block") return;
        setTimeout(function() {
            openDivFade(document.getElementById("userDropdown"));
        }, 300);
    },
    'click .workCard' (event) { // Display work information on work card click.
        var dom = event.target;
        while (event.target.className !== "workCard") event.target = event.target.parentNode;
        workid = event.target.getAttribute("workid");

        Session.set("newWork", false);
        Session.set("currentWorkId",workid);
        var thisWork = work.findOne({
            _id: workid
        });

        if (!Session.get("newWork") && !document.getElementById("optionsContainer").contains(event.target)) {
            var currClass = classes.findOne({
                _id: thisWork["class"]
            });
            if (!(Meteor.userId() === thisWork.creator || // If user has permission.
                    Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                    currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
                    currClass.banned.indexOf(Meteor.userId()) !== -1)) {
                var inputs = $('#editWork .change').css("cursor", "default");
            }
        }
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #requestSubmit' () {
        var area = document.getElementById("requestArea");
        if(area.value === "") return;
        var array = {};
        array.content = area.value;
        array.info = {
            "users": Meteor.users.find().fetch(),
            "userInfo": Meteor.user(),
            "userClasses": Session.get("calendarClasses")
        };
        Meteor.call("createRequest", array, function(err,result) {
            area.value = "Request sent!";
            setTimeout(function(){
                document.getElementById("requests").style.marginBottom = "-15.5vw";
                area.value = "";
                Session.set("commentRestrict",null);
            },750);
        });
    },
    // HANDLING INPUT CHANGING
    'click .change' (event) { // Click changable inputs. Creates an input where the span is.
        var thisWork = work.findOne({
            _id: Session.get("currentWorkId")
        });
        if (!Session.get("newWork") && !document.getElementById("optionsContainer").contains(event.target)) {
            var currClass = classes.findOne({
                _id: thisWork["class"]
            });
            if (!(Meteor.userId() === thisWork.creator || // If user has permission.
                    Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                    currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
                    currClass.banned.indexOf(Meteor.userId()) !== -1
                )) return;
        }
        // CSS and DOM manipulation.
        var ele = event.target;
        var modifyingInput = Session.get("modifying");
        if (ele.id !== modifyingInput && modifyingInput !== null) closeInput(modifyingInput);

        Session.set("modifying", ele.id);
        var dim = ele.getBoundingClientRect();
        ele.style.display = "none";
        var input = document.createElement("input");

        var typ = ele.getAttribute("type");
        if (typ === "textarea") {
            input = document.createElement("textarea");
            input.style.height = 3 * dim.height.toString() + "px";
            input.rows = "4";
        } else if (typ !== null) {
            input.type = typ;
            input.style.height = 0.9 * dim.height.toString() + "px";
        } else {
            input.typ = "text";
            input.style.height = 0.9 * dim.height.toString() + "px";
        }
        if (event.target.id !== "workDate") input.value = ele.childNodes[0].nodeValue;
        input.className = "changeInput";

        input.style.padding = "0.1%";
        input.id = ele.id + "a";
        ele.parentNode.appendChild(input);
        if (ele.getAttribute("re") == "readonly") {
            input.readOnly = true;
            input.className += " op";
            input.style.cursor = "pointer";
        } else {
            input.select();
        }
        if (ele.id === "workDate") {
            input.className += " form-control";
        }
        input.focus();
        var restrict = ele.getAttribute("restrict");
        if (restrict !== null) {
            input.maxLength = restrict;
            input.className += " restrict";
            Session.set("commentRestrict",restrict-input.value.length.toString() + " characters left");
            var text = document.getElementById(Session.get("modifying")+"restrict");
            text.style.display = "initial";
            text.style.color = "#7E7E7E";
        }
    },
    'click .radio' (event) { // Click dropdown input. Opens the dropdown menu.
        var thisWork = work.findOne({
            _id: Session.get("currentWorkId")
        });
        if (!Session.get("newWork") && !document.getElementById("optionsContainer").contains(event.target)) {
            var currClass = classes.findOne({
                _id: thisWork["class"]
            });
            if (!(Meteor.userId() === thisWork.creator ||
                Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
                currClass.banned.indexOf(Meteor.userId()) !== -1
            )) return;
        }

        var op = event.target;
        var radio;
        if (Session.equals("sidebar", "optionsContainer") || Session.equals("sidebar", "both")) {
            radio = "prefOptions";
        } else {
            radio = "workOptions";
        }
        try {
            for (var i = 0; i < document.getElementsByClassName(radio).length; i++) { // Close any previously open menus.
                var curr = document.getElementsByClassName(radio)[i];
                if (curr.childNodes[1] !== op.parentNode.parentNode.childNodes[3].childNodes[1]) {
                    closeDivFade(document.getElementsByClassName(radio)[i]);
                }
            }
        } catch (err) {}
        openDivFade(op.parentNode.parentNode.childNodes[3]);
    },
    'click .workOptionText' (event) { // Click each work setting
        var modifyingInput = Session.get("modifying");
        var p = event.target;
        var input = p.parentNode.parentNode.childNodes[1].childNodes[5];
        input.value = p.childNodes[0].nodeValue;
        closeDivFade(p.parentNode);
        try {
            closeInput(modifyingInput);
        } catch (err) {}
        input.focus();
    },
    'click .prefOptionText' (event) { // Click each preferences setting.
        var modifyingInput = Session.get("modifying");
        var p = event.target;
        var input = p.parentNode.parentNode.childNodes[1].childNodes[5];
        input.value = p.childNodes[0].nodeValue;
        closeDivFade(p.parentNode);
        try {
            closeInput(modifyingInput);
        } catch (err) {}
        input.focus();
    },
    'click #workComment' (event) {
        var restrict = event.target.maxLength;
        Session.set("commentRestrict",restrict-event.target.value.length.toString() + " characters left");
        var text = document.getElementById("commentrestrict");
        text.style.display = "initial";
        text.style.color = "#7E7E7E";
    },
    'keydown input' (event) { // Enter to close input.
        var modifyingInput = Session.get("modifying");
        if (event.keyCode == 13 && modifyingInput != "workDesc") {
            try {
                closeInput(modifyingInput);
            } catch (err) {}
        }
    },
    'input .restrict' (event) {
        var restrict = event.target.maxLength;
        var chars = restrict - event.target.value.length;
        var text;
        if(event.target.id === "workComment") {
            text = document.getElementById("commentrestrict");
        } else if(event.target.id === "requestArea") {
            text = document.getElementById("requestrestrict");
        } else {
            text = document.getElementById(Session.get("modifying")+"restrict");
        }
        text.style.color = "#7E7E7E";
        if (chars === restrict) { // Don't display if nothing in comment.
            Session.set("commentRestrict", "");
            return;
        } else if (chars === 0) {
            text.style.color = "#FF1A1A"; // Make text red if 0 characters left.
        }
        Session.set("commentRestrict", chars.toString() + " characters left");
    },
    'focus #workDatea' () { // Open date picker.
        $('#workDatea').datepicker({
            format: 'DD, MM d, yyyy',
            startDate: 'd',
            todayHighlight: true,
            todayBtn: true,
            autoclose: true
        });
    },
    // WORK OVERLAY BUTTONS
    'click #commentSubmit' (event) { // Click to submit a comment.
        workId = Session.get("currentWorkId");
        var input = document.getElementById('workComment');
        comment = input.value;
        input.value = "";
        Session.set("commentRestrict", null);
        if (comment !== "") {
            document.getElementById('workComment').value = "";
            Meteor.call('addComment', [comment, workId]);
        }
    },
    'click #workSubmit' () { // Click submit work to create a work.
        if (getHomeworkFormData() === null) return; // Makes sure to check valid homework.
        serverData = getHomeworkFormData();
        serverData.class = Session.get("currentWorkId");
        sendData("createWork");
        Session.set("newWork", null);
        closeDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #workDelete' () {
        serverData = Session.get("currentWorkId");
        sendData("deleteWork");
        closeDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #markDone' () { // Click done button.
        serverData = [Session.get("currentWorkId"), "done"];
        sendData("toggleWork");
    },
    'click #markConfirm' () { // Click confirm button.
        serverData = [Session.get("currentWorkId"), "confirmations"];
        sendData("toggleWork");
    },
    'click #markReport' () { // Click report button.
        serverData = [Session.get("currentWorkId"), "reports"];
        sendData("toggleWork");
    },
    // CLASS FILTERS
    'click .sideClass' (event) { // Click class list in sidebar.
        var div = event.target;
        while (div.getAttribute("classid") === null) div = div.parentNode;
        var classid = div.getAttribute("classid");

        if (Session.get("calCreWork")) { // If creating work from calendar.
            Session.get("calCreWork", null);
            Session.set("sidebar", null);

            var date = calWorkDate.split("-");
            date = new Date(date[0], parseInt(date[1]) - 1, date[2], 11, 59, 59);
            Session.set("newWork", true);
            Session.get("currentWorkId",classid);
            openDivFade(document.getElementsByClassName("overlay")[0]);
        } else { // Normal clicking turns on filter.
            var array = Session.get("classDisp");
            if (array.indexOf(classid) !== -1) {
                array.splice(array.indexOf(classid), 1);
            } else {
                array.push(classid);
            }
            Session.set("classDisp", array);
        }
    },
    'click .sideFilter' (event) {
        var div = event.target;
        while (div.getAttribute("type") === null) div = div.parentNode;
        var type = div.getAttribute("type");

        var array = Session.get("typeFilter");
        if (array.indexOf(type) !== -1) {
            array.splice(array.indexOf(type), 1);
        } else {
            array.push(type);
        }
        Session.set("typeFilter", array);
    },
    'click #disableFilter' () {
        Session.set("classDisp", []);
    },
    'mouseover .sideClass' (event) { // Highlight/scale filter on-hover.
        var div;
        if (event.target.className !== "sideClass") {
            div = event.target.parentNode;
        } else {
            div = event.target;
        }
        while (div.getAttribute("classid") === null) div = div.parentNode;
        var classid = div.getAttribute("classid");
        Session.set("classDispHover", classid);
    },
    'mouseleave .sideClass' (event) { // Turn off highlight/scale filter on-leave.
        if (event.target.className !== "sideClass") {
            var div = event.target.parentNode;
            if (div.contains(event.target)) return;
        }
        Session.set("classDispHover", null);
    },
    'mouseover .sideFilter' (event) {
        var div;
        if (event.target.className !== "sideFilter") {
            div = event.target.parentNode;
        } else {
            div = event.target;
        }
        while (div.getAttribute("type") === null) div = div.parentNode;
        var type = div.getAttribute("type");
        Session.set("typeFilterHover", type); 
    },
    'mouseleave .sideFilter' (event) {
        if (event.target.className !== "sideFilter") {
            var div = event.target.parentNode;
            if (div.contains(event.target)) return;
        }
        Session.set("typeFilterHover", null); 
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

function sendData(funcName) { // Call Meteor function, and do actions after function is completed depending on function.
    Meteor.call(funcName, serverData);
}

function closeInput(modifyingInput) { // Close a changeable input and change it back to span.
    var input = document.getElementById(modifyingInput + "a");
    var span = document.getElementById(modifyingInput);
    var color;
    if (Session.equals("sidebar", "optionsContainer") || Session.equals("sidebar", "both")) {
        color = "#000";
    } else {
        color = "#8C8C8C";
    }
    span.style.color = color;
    Session.set("commentRestrict","");
    try {
        input.parentNode.removeChild(input);
        document.getElementById(modifyingInput+"restrict").style.display = "none";
    } catch (err) {}
    if (input.value === "") { // If input has nothing.
        span.childNodes[0].nodeValue = "Click here to edit...";
    } else {
        span.childNodes[0].nodeValue = input.value;
    }
    span.style.display = "initial";
    Session.set("modifying", null);

    if (Session.equals("sidebar", "optionsContainer") || Session.equals("sidebar", "both")) { // Close depending on work or preferences.
        serverData = getPreferencesData();
        sendData("editProfile");
    } else if (!Session.get("newWork")) {
        if (getHomeworkFormData() === null) return;
        serverData = getHomeworkFormData();
        sendData("editWork");
    }
}

function getHomeworkFormData() { // Get all data relating to work creation.
    var inputs = document.getElementsByClassName("req");
    var stop;
    for (var i = 0; i < inputs.length; i++) {
        var value = inputs[i].childNodes[0].nodeValue;
        if (value.includes("Click here to edit")) {
            inputs[i].childNodes[0].nodeValue = "Missing field";
            inputs[i].style.color = "#FF1A1A";
            stop = true;
        }
    }
    if (stop) return null;
    var data;

    if (Session.get("newWork")) {
        data = {
            "class": Session.get("currentWorkId")
        };
    } else {
        data = work.findOne({
            _id: Session.get("currentWorkId")
        });
    }
    data.name = document.getElementById("workName").childNodes[0].nodeValue;
    data.dueDate = toDate(document.getElementById("workDate").childNodes[0].nodeValue);
    data.description = document.getElementById("workDesc").childNodes[0].nodeValue;
    data.type = document.getElementById("workType").childNodes[0].nodeValue.toLowerCase();

    return data;
}

function getPreferencesData() { // Get all data relating to preferences.
    var profile = Session.get("user");
    var options = {
        "theme": document.getElementById("prefTheme").childNodes[0].nodeValue.toLowerCase(),
        "mode": document.getElementById("prefMode").childNodes[0].nodeValue.toLowerCase(),
        "timeHide": ref[document.getElementById("prefHide").childNodes[0].nodeValue],
        "done": ref[document.getElementById("prefDone").childNodes[0].nodeValue],
        "hideReport": ref[document.getElementById("prefReport").childNodes[0].nodeValue]
    };
    profile.preferences = options;
    return profile;
}

var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getReadableDate(date) { // Get readable date from Date constructor.
    return days[date.getDay()] + ", " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}

function toDate(date) { // Turns formatted date back to Date constructor.
    date = date.substring(date.search(",") + 2, date.length);
    month = months.indexOf(date.substring(0, date.search(" ")));
    day = date.substring(date.search(" ") + 1, date.search(","));
    year = date.substring(date.search(",") + 2, date.length);
    return new Date(year, month, day, 11, 59, 59);
}

function formReadable(input, val) { // Makes work information readable by users.
    switch(val) {
        case "typeColor": return input.typeColor = workColors[input.type];
        case "name": return input.name;
        case "dueDate": return getReadableDate(input.dueDate);
        case "description": return input.description;
        case "type": return input.type[0].toUpperCase() + input.type.slice(1);
        case "comments":
            var comments = input.comments;
            var resort = [];
            if (Session.get("newWork")) return []; // Don't display comments if user is creating work.
            for (var k = 0; k < comments.length; k++) {
                var re = comments.length - k - 1;
                resort[re] = {
                    "comment": comments[k].comment,
                    "date": null,
                    "user": null,
                    "avatar": null,
                    "email":null
                };
                var user = Meteor.users.findOne({
                    _id: comments[k].user
                });
                resort[re].user = user.profile.name;
                resort[re].date = moment(comments[k].date).fromNow();
                resort[re].avatar = user.profile.avatar;
                resort[re].email = user.services.google.email;
            }
            return resort;
        case "done":
            if (Session.get("newWork")) return [];
            for (var i = 0; i < input.done.length; i++) { // Display users who marked as done.
                var user = Meteor.users.findOne({
                    _id: input.done[i]
                });

                input.done[i] = {
                    "user": user.profile.name,
                    "avatar": user.profile.avatar,
                    "email": user.services.google.email
                };
            }
            return input.done;
        case "doneCol":
            if (Session.get("newWork")) return "";
            if (!_.contains(input.done,Meteor.userId())) return "";
            return "#27A127";
        case "doneText":
            if (Session.get("newWork")) return "";
            if (!_.contains(input.done,Meteor.userId())) return "Mark done";
            return "Done!";
        case "userConfirm":
            if(!_.contains(input.confirmations, Meteor.userId())) return "";
            return "#27A127";
        case "confirmations":
            return input.confirmations.length;
        case "userReport":
            if(!_.contains(input.reports, Meteor.userId())) return "";
            return "#FF1A1A";
        case "reports":
            return input.reports.length;
        case "email":
            return Meteor.users.findOne({
                _id: input.creator
            }).services.google.email;
        case "avatar":
            return Meteor.users.findOne({
                _id: input.creator
            }).profile.avatar;
        case "creator":
            return Meteor.users.findOne({
                _id: input.creator
            }).profile.name;
    }
}
