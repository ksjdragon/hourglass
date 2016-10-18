/* jshint esversion: 6 */
import {
    Template
} from 'meteor/templating';

import './main.html';

var load = true;
var calWorkOpen = null;
var calWorkDate = null;
modifyingInput = null;
dropOpen = null;

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

// Reactive variables.
Session.set("user", {}); // Stores user preferences.
Session.set("calendarClasses", []); // Stores calendar classes.
Session.set("sidebar", null); // Status of sidebar.
Session.set("requests", false); // Status of requests.
Session.set("newWork", null); // If user creating new work.
Session.set("currentWork",null);
Session.set("noclass", null); // If user does not have classes.
Session.set("calCreWork", null); // If user is creating a work from calendar.
Session.set("classDisp", []); // Stores current filter for classes.
Session.set("typeFilter", []); // Stores type filters for classes.
Session.set("typeFilterHover", null); // Stores current hovered type filter.
Session.set("classDispHover", null); // Stores current hovered class filter.
Session.set("refetchEvents", null); // Stores whether to get calendar events again.
Session.set("restrictText", {}); // Stores text for comment character restriction.


Template.login.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
};

Template.main.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
    setTimeout(startDragula, 300);
    $(".optionText").hover(
        function() {
            $(this).addClass("selectedOption");
        },
        function() {
            $(this).removeClass("selectedOption");
        }
    );
};

Template.profile.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
    $(".optionText").hover(
        function() {
            console.log("hi");
            $(this).addClass("selectedOption");
        },
        function() {
            $(this).removeClass("selectedOption");
        }
    );
};

Template.registerHelper('userProfile', () => {
    if (Meteor.user() === undefined || Meteor.user() === null) return;
    Session.set("user", Meteor.user().profile);
    return;
});

Template.registerHelper('adminPage', () => {
    return window.location.pathname.includes("/");
});

Template.registerHelper('screen', (multiplier, fraction) => {
    if (typeof multiplier !== "string") return screen.width.toString() + "px";
    if (typeof fraction !== "string") return (screen.width * parseFloat(multiplier)).toString() + "px";
    return ((screen.width) * parseFloat(multiplier) / parseFloat(fraction)).toString() + "px";
});

Template.registerHelper('divColor', (div) => { // Reactive color changing based on preferences. Colors stored in themeColors.
    return Session.get("user").preferences.theme[div];
});

Template.registerHelper('textColor', () => { // Reactive color for text.
    document.getElementsByTagName("body")[0].style.color = Session.get("user").preferences.theme.textColor;
    return;
});

Template.registerHelper('overlayDim', (part) => { // Gets size of the overlay container.
    var dim = [window.innerWidth * 0.25, window.innerHeight * 0.2];
    var width = "width:" + dim[0].toString() + "px;";
    var height = "height:" + dim[1].toString() + "px;";
    var margin = "margin-left:" + (-dim[0] / 2).toString() + "px;";
    var bg = "background-color:" + Session.get("user").preferences.theme.header + ";";
    return width + height + margin + bg;
});

Template.registerHelper('myClasses', () => { // Gets all classes and respective works.
    if (Session.get("user").classes.length === 0) { // Null checking.
        Session.set("noclass", true); // Makes sure to display nothing.
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
                    thisWork[j] = "no";
                }

                if (thisWork[j] !== "no" && Session.get("user").preferences.hideReport && (thisWork[j].confirmations.length / thisWork[j].reports.length) <= 0.9) {
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

                thisWork[j].creator = Meteor.users.findOne({
                    _id: thisWork[j].creator
                }).profile.name;
                var conf = thisWork[j].confirmations.length;
                var repo = thisWork[j].reports.length;
                var ratio = conf / repo;
                var normalColor = Session.get("user").preferences.theme["text"];
                if (Math.abs(conf - repo)) {
                    if ((conf + repo) <= 1) {
                        thisWork[j].doneRatio = normalColor;
                    } else {
                        thisWork[j].doneRatio = "#F9F906";
                    }
                } else if (ratio >= 2) {
                    thisWork[j].doneRatio = "#33DD33";
                } else if (ratio <= 0.9) {
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
    return options[val].filter(function(entry) {
        return (val === 'theme') ? _.isEqual(preferences[val], themeColors[entry.val]) : preferences[val] === entry.val;
    })[0].alias;
});

Template.registerHelper('restrict', (input) => { // Returns characters left for comment length.
    var restrict = Session.get("restrictText");
    $(".resText").removeClass("noneLeft");
    if(Object.keys(restrict).length === 0) return "";
    if(restrict[restrict.selected][0] === "0") $(".resText").addClass("noneLeft");
    return (restrict.selected === input) ? Session.get("restrictText")[input] : "";
});

Template.registerHelper('selectOptions', (val) => {
    if(val === "grade") {
        var grade = [];
        for(var i = 0; i < 5; i++) {
            var year = (new Date).getFullYear() + i;
            grade.push( { "val": year, "alias": year.toString() } );
        }
        return grade;
    } else if(val === "school") {
        var school = [];
        var schoolList = schools.find().fetch();
        for(var i = 0; i < schoolList.length; i++) {
            school.push( { "val": schoolList[i].name, "alias": schoolList[i].name } );
        }
        return school;
    } else {
        return options[val];
    }
});

Template.registerHelper('work', (value) => {// Returns the specified work value.
    var thisWork = Session.get("currentWork");
    if (Session.equals("currentWork", null)) return;
    if (Session.get("newWork") && (thisWork[value] === true || thisWork[value] === undefined)) {
        return defaultWork[value];
    } else {
        return formReadable(thisWork,value);
    }
});

Template.main.helpers({
    /*themeName() {
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
    schoolName() { // Finds the name of the user's school.
        if (Session.get("user").school === undefined || Session.get("user").school === null) return;
        return " - " + Session.get("user").school;
    },
    iconColor(icon) { // Sidebar status color
        if (Session.equals("sidebar", icon + "Container")) {
            return Session.get("user").preferences.theme.statusIcons;
        } else if (Session.equals("sidebar", "both")) {
            return Session.get("user").preferences.theme.statusIcons;
        } else {
            return;
        }
    },
    avatar() { // Returns avatar.
        return Meteor.user().services.google.picture;
    },
    username() { // Returns user name.
        return Session.get("user").name;
    },
    defaultMode() { //Loads the default display mode for user.
        if (load) Session.set("mode", Session.get("user").preferences.mode);
        load = false;
        return;
    },
    bgSrc() { // Returns background.
        return "Backgrounds/" + Session.get("user").preferences.theme.background;
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
        if (!Session.equals("mode", status)) return;
        return Session.get("user").preferences.theme.modeHighlight;
    },
    currMode(name) { // Status of display mode.
        return Session.equals("mode", name);
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
                Session.set("currentWork", work.findOne({_id: event.id}));
                openDivFade(document.getElementsByClassName("overlay")[0]);
            },
            eventMouseover: function(event, jsEvent, view) {
                this.style.boxShadow = "inset 0 0 0 99999px rgba(255,255,255,0.2)";
            },
            eventMouseout: function(event, jsEvent, view) {
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
        if (Session.equals("mode", "classes")) {
            $(".workCard").toggleClass("scaled", false);
            try {
                $(".workCard[classid=\'" + hoverHighlight + "\']").toggleClass("scaled", true);
                $(".workCard[type=\'" + typeHighlight + "\']").toggleClass("scaled", true);
            } catch (err) {}
        } else {
            $(".workevent").toggleClass("scaled", false);
            try {
                $("." + hoverHighlight).toggleClass("scaled", true);
                $("." + typeHighlight).toggleClass("scaled", true);
            } catch (err) {}
        }
        return;
    },
    newWork() { // If user is creating a new work.
        return Session.get("newWork");
    },
    types() {
        var types = Object.keys(workColors);
        var array = [];
        for (var i = 0; i < types.length; i++) {
            array.push({
                "type": types[i],
                "typeName": types[i][0].toUpperCase() + types[i].slice(1),
                "selected": _.contains(Session.get("typeFilter"), types[i])
            });
        }
        return array;
    },
    inRole() { // Checks correct permissions.
        if(Session.equals("currentWork",null)) return;
        var thisWork = work.findOne({
            _id: Session.get("currentWork")._id
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

        if(modifyingInput !== null && event.target !== document.getElementById(modifyingInput)) {
            if (!(e.includes("optionHolder") || e.includes("optionText"))) {
                if(document.getElementById(modifyingInput).className.includes("dropdown")) {
                    $(".optionHolder")
                    .fadeOut(250, "linear");

                    $(".selectedOption").removeClass("selectedOption");
                } else {     
                    closeInput(modifyingInput);
                }
                modifyingInput = null;
            }
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
            $('.req').css("color", "");
            Session.set("commentRestrict", null);
        }

        if (!document.getElementById("userDropdown").contains(event.target)) closeDivFade(document.getElementById("userDropdown"));
        if (!document.getElementById("requests").contains(event.target)) Session.set("requests", false);
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
        Session.set("requests", !Session.get("requests"));
    },
    'click .classes' () { // Click classes mode button.
        if (Session.equals("mode", "classes")) return;
        var modeHolder = document.getElementById("mainBody");
        closeDivFade(modeHolder);
        setTimeout(function() {
            Session.set("mode", "classes");
            openDivFade(modeHolder);
        }, 300);
        setTimeout(startDragula, 500);
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
        Session.set("currentWork",{class: attr});
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #dropdown' (event) {
        if (document.getElementById("userDropdown").style.display === "block") return;
        setTimeout(function() {
            openDivFade(document.getElementById("userDropdown"));
        }, 100);
    },
    'click .workCard' (event) { // Display work information on work card click.
        var dom = event.target;
        while (event.target.className !== "workCard") event.target = event.target.parentNode;
        var workid = event.target.getAttribute("workid");

        var thisWork = work.findOne({
            _id: workid
        });

        Session.set("newWork", false);
        Session.set("currentWork", thisWork);

        if (!Session.get("newWork") && !document.getElementById("optionsContainer").contains(event.target)) {
            var currClass = classes.findOne({
                _id: thisWork["class"]
            });
            if (!(Meteor.userId() === thisWork.creator || // If user has permission.
                    Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                    currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
                    currClass.banned.indexOf(Meteor.userId()) !== -1)) {
                var inputs = $('#editWork .clickModify').css("cursor", "default");
            }
        }
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #requestSubmit' () {
        var area = document.getElementById("requestArea");
        if (area.value === "") return;
        var array = {};
        array.content = area.value;
        array.info = {
            "users": Meteor.users.find().fetch(),
            "userInfo": Meteor.user(),
            "userClasses": Session.get("calendarClasses")
        };
        Meteor.call("createRequest", array, function(err, result) {
            area.value = "Request sent!";
            setTimeout(function() {
                document.getElementById("requests").style.marginBottom = "-15.5vw";
                area.value = "";
                Session.set("commentRestrict", null);
            }, 750);
        });
    },
    'click #exportDiv' (event) {
        var events = [];
        var userClasses = Session.get("calendarClasses");

        for (var i = 0; i < userClasses.length; i++) {
            var works = userClasses[i].thisClassWork;
            for (var j = 0; j < works.length; j++) {
                var work = works[j];
                var workclass = classes.findOne({
                    _id: work.class
                });
                if (work.description == defaultWork.description) work.description = "";
                if (work.dueDate == defaultWork.dueDate) continue;
                if (work.name == defaultWork.name) work.name = "";
                if (workclass === undefined) workclass = {
                    name: "Personal"
                };
                events.push([
                    workclass.name + ": " + work.name,
                    work.realDate.toLocaleDateString(),
                    work.description,
                    "True"
                ]);
            }
        }

        var JSONevents = JSON.stringify(events);
        var CSVevents = Papa.unparse({
            fields: ["Subject", "Start Date", "Description", "All Day Event"],
            data: JSONevents
        });
        var eventBlob = new Blob([CSVevents], {
            type: "data:text/csv;charset=utf-8"
        });
        saveAs(eventBlob, "hourglass.csv");
    },
    // HANDLING INPUT CHANGING
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
        if(modifyingInput[0] === 'w') {
            var newSetting = Session.get("currentWork");
            newSetting[modifyingInput.charAt(1).toLowerCase() + modifyingInput.slice(2)] = option.toLowerCase();
            Session.set("currentWork", newSetting);
            serverData = Session.get("currentWork");
            if(checkMissing()) return;
            sendData("editWork")
        } else {
            var newSetting = Session.get("user");
            newSetting.preferences[modifyingInput] = (function() {
                var value = options[modifyingInput].filter(function(entry) {
                    return option === entry.alias;
                })[0].val;
                return (modifyingInput === 'theme') ? themeColors[value] : value;
            })();
            Session.set("user", newSetting);
            serverData = Session.get("user");
            sendData("editProfile"); 
        }

        $("#" + modifyingInput).next()
        .fadeOut(250, "linear");;

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
    'focus #wDueDate' () { // Open date picker.
        $('#wDueDate').datepicker({
            format: 'DD, MM d, yyyy',
            clickInput: true,
            startDate: 'd',
            todayHighlight: true,
            todayBtn: true,
            autoclose: true
        });
    },
    // WORK OVERLAY BUTTONS
    'click #commentSubmit' (event) { // Click to submit a comment.
        workId = Session.get("currentWork")._id;
        var input = document.getElementById('workComment');
        comment = input.value;
        input.value = "";
        if (comment !== "") {
            document.getElementById('workComment').value = "";
            serverData = [comment, workId];
            sendData("addComment");
        }
    },
    'click #workSubmit' () { // Click submit work to create a work.
        serverData = Session.get("currentWork");
        if(checkMissing()) return;
        sendData("createWork");
        Session.set("newWork",false);
        closeDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #workDelete' () {
        serverData = Session.get("currentWork")._id;
        sendData("deleteWork");
        closeDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #markDone' () { // Click done button.
        serverData = [Session.get("currentWork")._id, "done"];
        sendData("toggleWork");
    },
    'click #markConfirm' () { // Click confirm button.
        serverData = [Session.get("currentWork")._id, "confirmations"];
        sendData("toggleWork");
    },
    'click #markReport' () { // Click report button.
        serverData = [Session.get("currentWork")._id, "reports"];
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
            Session.set("currentWork", {class: classid, dueDate: date});
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

// Other Functions

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
    Meteor.call(funcName, serverData, function(error, result) {
        serverData = null;
        currWork = Session.get("currentWork");
        if(currWork !== null && currWork._id !== undefined) {
            Session.set("currentWork", work.findOne({
                _id: currWork._id
            }));
        }
    });
}

function closeInput() { // Close a changeable input and change it back to span.
    var data = getHomeworkFormData();   
    Session.set("currentWork", data);
    Session.set("restrictText", {});
    $("#"+modifyingInput).css('cursor','pointer');
    if(!Session.get("newWork")) {
        serverData = Session.get("currentWork");
        if(checkMissing()) return;
        sendData("editWork");
    } 
}

function getHomeworkFormData() { // Get all data relating to work creation.
    var inputs = ["wName", "wDueDate", "wDescription", "wType"]; // All work fields.
    var optional = ["wDescription"]; // Optional work fields.
    var data = Session.get("currentWork");
    for(var i = 0; i < inputs.length; i++) {
        var title = inputs[i].charAt(1).toLowerCase() + inputs[i].slice(2);
        var thisData = (function() {
            if(title === "type") {
                return $("#"+inputs[i]+" span")[0].childNodes[0].nodeValue.toLowerCase();
            } else if (title === "dueDate") {
                var val = $("#"+inputs[i])[0].value;
                return (val.includes(defaultWork[title].slice(0,-3))) ? val : toDate(val);
            } else {
                return $("#"+inputs[i])[0].value;
            }
        })();
        // True signifies missing field to prevent missing if value is'Missing field.'
        data[title] = (thisData.toString().includes(defaultWork[title].slice(0,-3)) && !_.contains(optional, title)) ? true : thisData;
    }
    return data;
}

function checkMissing() {
    var no = false;
    for(var key in serverData) {
        if(!_.contains(["name","dueDate","description","type"],key)) continue;
        var id = "w" + key.charAt(0).toUpperCase() + key.slice(1);
        if(serverData[key] === true || serverData[key] === "") {
            no = true;
            $("#"+id).addClass("formInvalid");
            $("#"+id)[0].value = "";
            $("#"+id)[0].placeholder = "Missing field";
        } else {
            $("#"+id)[0].placeholder = "";
            $("#"+id).removeClass("formInvalid");
        }
    }
    return no;
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
    switch (val) {
        case "typeColor":
            return input.typeColor = workColors[input.type];
        case "name":
            return input.name;
        case "dueDate":
            return getReadableDate(input.dueDate);
        case "description":
            return input.description;
        case "type":
            return input.type[0].toUpperCase() + input.type.slice(1);
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
                    "email": null
                };
                var user = Meteor.users.findOne({
                    _id: comments[k].user
                });
                resort[re].user = user.profile.name;
                resort[re].date = moment(comments[k].date).fromNow();
                resort[re].avatar = user.services.google.picture;
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
                    "avatar": user.services.google.picture,
                    "email": user.services.google.email
                };
            }
            return input.done;
        case "doneCol":
            if (Session.get("newWork")) return "";
            if (!_.contains(input.done, Meteor.userId())) return "";
            return "#27A127";
        case "doneText":
            if (Session.get("newWork")) return "";
            if (!_.contains(input.done, Meteor.userId())) return "Mark done";
            return "Done!";
        case "userConfirm":
            if (!_.contains(input.confirmations, Meteor.userId())) return "";
            return "#27A127";
        case "confirmations":
            return input.confirmations.length;
        case "userReport":
            if (!_.contains(input.reports, Meteor.userId())) return "";
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
            }).services.google.picture;
        case "creator":
            return Meteor.users.findOne({
                _id: input.creator
            }).profile.name;
    }
}

function startDragula() {
    dragula([document.querySelector('#classesMode'), document.querySelector('#nonexistant')], {
        moves: function(el, container, handle) {
            // return handle.classList.contains("classInfo") || handle.classList.contains("mainClassName");
            return _.intersection(["classInfo", "mainClassName", "mainClassHour", "mainClassTeacher"], handle.classList).length > 0;
        }
    })
    .on('out', function(el) {
        var els = document.getElementsByClassName("classWrapper");
        var final = [];
        for (var i = 0; i < els.length; i++) {
            var classid = els[i].getElementsByClassName("creWork")[0].getAttribute("classid");
            final.push(classid);
        }
    });
}
