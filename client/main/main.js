/* jshint esversion: 6 */
import {
    Template
} from 'meteor/templating';

import './main.html';

var load = true;
var calWorkOpen = null;
var calWorkDate = null;
var dragging = false;
var clicked = false;
var workChanger = false;
var disconnect= false;

// Reactive variables.
Session.set("user", {}); // Stores user preferences.
Session.set("calendarEvents", []); // Stores calendar classes.
Session.set("myClasses", []); // Stores user classes.
Session.set("myWork", []); // Stores user related work.
Session.set("filterWork", []); // Stores work that is filtered out.
Session.set("requests", false); // Status of requests.
Session.set("sidebarMode", ""); // Status of sidebars.
Session.set("newWork", null); // If user creating new work.
Session.set("currentWork",null); // Current stored work.
Session.set("classDisp", []); // Stores current filter for classes.
Session.set("typeFilter", []); // Stores type filters for classes.
Session.set("typeFilterHover", null); // Stores current hovered type filter.
Session.set("classDispHover", null); // Stores current hovered class filter.
Session.set("restrictText", {}); // Stores text for comment character restriction.
Session.set("confirmText", ""); // Stores text for confirmations.

// On render actions

Meteor.autorun(function () {
    if (Meteor.status().status !== "connected" && Meteor.status().status !== "connecting" && !disconnect) {
        disconnect = true;
        var div = document.createElement("div");
        div.id = "disconnect"; 
        var h = document.createElement("h3");
        h.appendChild(document.createTextNode("Uh Oh. We can't reach you right now!"));
        var h2 = document.createElement("h4");
        h2.appendChild(document.createTextNode("Please check your connection, or reload the page!"));
        var h5 = document.createElement("h5");
        h5.appendChild(document.createTextNode("Reload!"));
        h5.onclick = function() {
            location.reload();
        }
        div.appendChild(h);
        div.appendChild(h2);
        div.appendChild(h5);
        document.getElementsByTagName("body")[0].appendChild(div);
        $("#disconnect").velocity("fadeIn", 150);
    } 
});

Template.login.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
};

Template.main.created = function() {
    Session.set("mode", Session.get("user").preferences.mode);
    Session.set("myWork", []);
    Session.set("filterWork", []);
    Session.set("classInfo", null);
    $(document).on('keyup', (e) => {
        if(event.keyCode === 27 && $(".overlay").css("display") !== "none") {
            $(".overlay").velocity("fadeOut", 150);
            Session.set("currentWork", null);
        }
    });

    work.find().observeChanges({
        added: function (id, fields) {
            updateWork(id, fields, "added");
            filterWork();
        },
        changed: function (id, fields) {
            updateWork(id, fields, "changed");
            filterWork();
        },
        removed: function (id) {
            updateWork(id, null, "remove");
        }
    });
    /*if (Notification.permission !== "granted") {
        Notification.requestPermission().then(function(result) {

        });
    }*/
}

Template.main.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
    setTimeout(startDragula, 300);
    $("#menuContainer").toggle();
    $("#doneUsers").slimScroll({
        height: '34vh',
        touchScrollStep: 90
    });

    document.getElementsByTagName("body")[0].style.color = Session.get("user").preferences.theme.textColor;
};

Template.classesMode.rendered = function() {
    $(".workHolder").slimScroll({
        width: '100%',
        height: '',
        touchScrollStep: 90
    });
    $(".mainClass .slimScrollBar").css("display", "none");
    
    var area = $("#classesMode");
    var clickX = 0;
    var reducer = 0.5;

    area.on({
        'mousemove': function(e) {
            if(clicked && !dragging) {
                area.scrollLeft(area.scrollLeft() + (clickX - reducer*e.pageX));
                clickX = reducer*e.pageX;
            }
        },
        'mousedown': function(e) {
            clicked = true;
            clickX = reducer*e.pageX;
        },
        'mouseup': function() {
            clicked = false;
        }
    });

    /*if(dragging) {
        var onLeft = e.pageX <= .1*screen.width;
        var onRight = e.pageX >= (window.innerWidth-.1*screen.width);
        console.log(onLeft);
        if(onLeft) {
            area.scrollLeft(area.scrollLeft() - 5);
        } else if(onRight) {
            area.scrollLeft(area.scrollLeft() + 5);
        }
    }*/
};

// Global Helpers

Template.registerHelper('version', () => {
    return version;
});

Template.registerHelper('screen', (multiplier, fraction) => {
    if (typeof multiplier !== "string") return screen.width.toString() + "px";
    if (typeof fraction !== "string") return (screen.width * parseFloat(multiplier)).toString() + "px";
    return ((screen.width) * parseFloat(multiplier) / parseFloat(fraction)).toString() + "px";
});

Template.registerHelper('divColor', (div) => { // Reactive color changing based on preferences. Colors stored in themeColors.
    if(Session.get("user") === null) return;
    return (Object.keys(Session.get("user")).length === 0) ? themeColors["lux"][div] : Session.get("user").preferences.theme[div];
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
    var myClasses = Session.get("user").classes;
    getClasses(myClasses);
    return Session.get("myClasses");
});

Template.registerHelper('pref', (val) => { // Obtains all user preferences.
    try {
        if(val === "school") return Session.get("user").school;
        var preferences = Session.get("user").preferences;
        return options[val].filter(function(entry) {
            return (val === 'theme') ? _.isEqual(preferences[val], themeColors[entry.val]) : preferences[val] === entry.val;
        })[0].alias;
    } catch(err) {}
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
            var year = (new Date()).getFullYear() + i;
            grade.push( { "val": year, "alias": year.toString() } );
        }
        grade.push( { "val": 0, "alias": "Faculty" } ); 
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
    if(Session.equals("currentWork", null)) return;
    if(Session.get("newWork")) {
        switch(value) {
            case "class":
                var id = thisWork["class"];
                return (id === Meteor.userId()) ? "Personal" : classes.findOne({_id: id}).name;
            case "dueDate":
                return getReadableDate(thisWork.dueDate);
            case "type":
                return options.type.filter(function(names) {
                    return names.val === thisWork.type;
                })[0].alias;
            default:
                return;
        }
    }

    var input = thisWork;
    try {
        switch (value) {
            case "typeColor":
                return input.typeColor = workColors[input.type];
            case "name":
                return input.name;
            case "class":
                var id = input["class"]; 
                return (id === Meteor.userId()) ? "Personal" : classes.findOne({_id: id}).name;
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
            case "doneIcon":
                if (Session.get("newWork")) return "";
                if (!_.contains(input.done, Meteor.userId())) return "fa-square-o";
                return "fa-check-square-o";
            case "userConfirm":
                if (!_.contains(input.confirmations, Meteor.userId())) return (Meteor.Device.isPhone() || Meteor.Device.isTablet()) ? "rgb(101,101,101)" : "";
                return "#27A127";
            case "confirmations":
                return input.confirmations.length;
            case "userReport":
                if (!_.contains(input.reports, Meteor.userId()))  return (Meteor.Device.isPhone() || Meteor.Device.isTablet()) ? "rgb(101,101,101)" : "";
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
    } catch(err){}
});

Template.registerHelper('confirmText', () => {
    return Session.get("confirmText");
})

// Main template helpers and events

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
    avatar() { // Returns avatar.
        try { 
            return Meteor.user().services.google.picture;
        } catch(err) {}
    },
    username() { // Returns user name.
        return Session.get("user").name;
    },
    bgSrc() { // Returns background.
        return "MDBackgrounds/" + "MD"+Session.get("user").preferences.theme.background;
    },
    iconStatus(icon) {
        var sidebar = Session.get("sidebarMode");
        return (sidebar === icon) ? Session.get("user").preferences.theme.iconHighlight + ";background-color:rgba(0,0,0,0.2)" : "";
    },
    sidebarStatus(sidebar) {
        return sidebar === Session.get("sidebarMode");  
    },
    requestStatus() {
        if (Session.get("requests")) return "0px";
        return openValues.requests;
    },
    currMode(mode) { // Status of display mode.
        return Session.equals("mode", mode);
    },
    currSettingMode(mode) {
        return Session.equals("settingMode", mode) && Session.equals("sidebarMode", "option");
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
            events: Session.get("calendarEvents"),
            eventDrop: function(event, delta, revertFunc) { // When user drops from click-dragging.
                var current = work.findOne({
                    _id: event.id
                });
                var date = event.start.format().split("-");
                current.dueDate = new Date(date[0], parseInt(date[1]) - 1, date[2], 11, 59, 59);
                if(Date.parse(new Date()) > Date.parse(current.dueDate)) {
                    revertFunc();
                    return;
                }
                serverData = current;
                sendData("editWork");
            },
            eventClick: function(event, jsEvent, view) { // On-click for work.
                Session.set("newWork", false);
                Session.set("currentWork", work.findOne({_id: event.id}));
                $(".overlay").velocity("fadeIn", 150);
                $("#comment").slimScroll({
                    width: '100%',
                    height: '20vh',
                    touchScrollStep: 90
                });
            },
            eventMouseover: function(event, jsEvent, view) {
                var classid = work.findOne({_id: event.id})["class"];
                var className = (classid === Meteor.userId()) ? "Personal" : classes.findOne({_id: classid}).name;
                var span = this.children[0].children[0];
                $(span).velocity("stop");
                $(span).velocity({opacity:0}, 50, function() {
                    span.childNodes[0].nodeValue = className;
                    $(span).velocity({opacity:1}, 50);
                });
                this.style.boxShadow = "inset 0 0 0 99999px rgba(255,255,255,0.2)";
            },
            eventMouseout: function(event, jsEvent, view) {
                var workName = work.findOne({_id: event.id}).name;
                var span = this.children[0].children[0];
                $(span).velocity("stop");
                $(span).velocity({opacity:0}, 50, function() {
                    span.childNodes[0].nodeValue = workName;
                    $(span).velocity({opacity:1}, 50);
                });
                this.style.boxShadow = "";
            },
            dayClick: function(date, jsEvent, view) { // On-click for each day.
                if (jsEvent.target.className.includes("fc-past")) return;
                var realDate = date;
                date.startOf("day");
                realDate = realDate._d;
                Session.set("newWork", true);
                Session.set("currentWork", {dueDate: realDate, type: "normal"});
                if(!Session.equals("sidebarMode", "create")) toggleToSidebar("create");
            }
        };
    },
    calCenter() { // Centers the calendar
        var width = window.innerWidth * 0.85;
        return "width:" + width.toString() + "px;margin-left:" + (0.5 * window.innerWidth - 0.5 * width).toString() + "px;";
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
    inRole() { // Checks correct permissions.
        if(Session.equals("currentWork",null)) return;
        try {
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
        } catch(err) {}
    },
    admin() {
        return Roles.userIsInRole(Meteor.userId(), ['admin', 'superadmin']);
    }
});

Template.main.events({
    'click' (event) { // Closes respective divs when clicking outside of them. Order matters.
        var e = event.target.className;

        if(modifyingInput !== null && event.target !== document.getElementById(modifyingInput)) {
            if (!(e.includes("optionHolder") || e.includes("optionText"))) {
                if(document.getElementById(modifyingInput).className.includes("dropdown")) {
                    toggleOptionMenu(false, modifyingInput);
                } else {
                    closeInput(modifyingInput);
                }
                modifyingInput = null;
            }
        }

        if (!e.includes("fa-cog") && // Sidebar closing.
        !e.includes("fa-bars") &&
        !e.includes("fa-question") &&
        !document.getElementById("menuContainer").contains(event.target) &&
        !document.getElementById("menuBar").contains(event.target)) {
            if(!(e.includes("fc-day") && !e.includes("fc-past")) && 
            !Session.equals("sidebarMode", "option")) {
                toggleToSidebar(false);
            }
        }

        if (e === "overlay") { // Overlay closing.
            $(".overlay").velocity("fadeOut", 150);
            if (!Session.get("newWork")) {
                document.getElementById("workComment").value = "";
                var res = Session.get("restrictText");
                res[Object.keys(res)[0]] = "";
                Session.set("restrictText", res);
                Session.set("currentWork", null);
            }
        }

        if (document.getElementById("userDropdown").style.display === "block" && 
            !document.getElementById("userDropdown").contains(event.target)) 
            $("#userDropdown").velocity("fadeOut", 150);
    },
    // MAIN MENU BUTTONS
    'click .fa-bars' (event) { // Click menu button.
        toggleToSidebar("menu");
    },
    'click .fa-cog' (event) { // Click settings button.
        toggleToSidebar("option");
    },
    'click .fa-question' (event) { // Click requests button.
        toggleToSidebar("requests");
    },
    'click .creWork' (event) { // Cick add work button.
        var attr;
        attr = event.target.getAttribute("classid");
        Session.set("newWork", true);
        Session.set("currentWork",{class: attr, dueDate: moment().startOf('day').add(1,"days")._d, type:"normal"});
        $(".overlay").velocity("fadeIn", 150);
        $("#comment").slimScroll({
            width: '100%',
            height: '20vh',
            touchScrollStep: 90
        });
        $("#workComments .slimScrollBar").css("display", "none");
    },
    'click .fa-check-circle-o' () { // Confirmation Button
        sendData(confirm);
        $("#confirmOverlay").velocity("fadeOut", 150);
        if(confirm === "changeAdmin") {
            $("#changeAdminWrapper").velocity("fadeOut", 150);
        } else if(confirm === "deleteClass") {
            Session.set("classInfo", null);
        }
        serverData = null;
        confirm = null;     
    },
    'click .fa-times-circle-o' () { // Deny Button
        $("#confirmOverlay").velocity("fadeOut", 150);
        serverData = null;
        confirm = null;
    },
    'click #dropdown' (event) {
        if (document.getElementById("userDropdown").style.display === "block") return;
        $("#userDropdown").velocity("fadeIn", 150);
    },
    'click .workCard' (event) { // Display work information on work card click.
        if(event.target.className.indexOf("fa") !== -1) return;
        var workid = event.target.getAttribute("workid");
        var thisWork = work.findOne({
            _id: workid
        });

        Session.set("newWork", false);
        Session.set("currentWork", thisWork);

        $(".overlay").velocity("fadeIn", 150);
        $("#comment").slimScroll({
            width: '100%',
            height: '20vh',
            touchScrollStep: 90
        });
        $("#workComments .slimScrollBar").css("display", "none");
    },
    'click #requestSubmit' () {
        var area = document.getElementById("requestArea");
        if (area.value === "") return;
        var array = {};
        array.content = area.value;
        array.info = {
            "users": Meteor.users.find().fetch(),
            "userInfo": Meteor.user(),
            "userClasses": Session.get("myClasses")
        };
        Meteor.call("createRequest", array, function(err, result) {
            area.value = "";
            Session.set("restrictText", {});
            $("#requestSubmit span:first-child").fadeOut(200, function() {
                $("#requestSubmit span:nth-child(2)").velocity("fadeIn", 200);
            })
            setTimeout(function() {
                $("#requestSubmit span:nth-child(2)").fadeOut(200, function() {
                    $("#requestSubmit span:first-child").velocity("fadeIn", 200);
                })
            }, 1250);
        });
    },
    'click #exportDiv' (event) {
        var events = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//hacksw/handcal//NONSGML v1.0//EN";
        var userClasses = Session.get("myClasses");
        var timestamp = new Date().toJSON().replace(/-|:|\./gi, "");
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
                if (work.description === undefined) {
                    work.description = "";
                } else {
                    work.description = " - " + work.description;
                }
                var duedate = work.dueDate.toJSON().slice(0,10).replace(/-/gi,"");
                events += "\nBEGIN:VEVENT" +
                    "\nUID:" + timestamp + work._id + "@hourglass.tk" +
                    "\nDTSTAMP:" + timestamp +
                    "\nDTSTART:" + duedate +
                    "\nDTEND:" + duedate +
                    "\nSUMMARY:" + work.name + work.description +
                    "\nCATEGORIES:" + workclass.name +
                    "\nEND:VEVENT";
            }
            events += "\nEND:VCALENDAR";
        }
        var eventBlob = new Blob([events], {
            type: "data:text/ics;charset=utf-8"
        });
        saveAs(eventBlob, "hourglass.ics");
    },
    // HANDLING INPUT CHANGING
    'focus .clickModify' (event) {
        toggleOptionMenu(false, modifyingInput);

        if(modifyingInput !== null) {
            if(!$("#"+modifyingInput)[0].className.includes("dropdown")) closeInput(modifyingInput);
        }
        modifyingInput = event.target.id;
        if(!$("#"+modifyingInput)[0].className.includes("dropdown")) {
            event.target.select();
            event.target.style.cursor = "text";
            event.target.style.backgroundColor = "rgba(0,0,0,0.1)";
        }
    },
    'keydown #wName' (event) {
        if(event.keyCode === 13) {
            closeInput(modifyingInput);
            event.target.blur();
        }
    },
    'focus #workComment' () {
        toggleOptionMenu(false, modifyingInput);
        modifyingInput = null;
    },
    'keydown .dropdown' (event) {
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
            $("#"+modifyingInput)[0].focus();
        }
    },
    'click .dropdown, focus .dropdown' (event) {
        if(clickDisabled) return;
        clickDisabled = true;
        if(event.target.id === optionOpen[0] && optionOpen[1]) {
            toggleOptionMenu(false, event.target.id);
        } else {
            toggleOptionMenu(true, event.target.id);
        }
        setTimeout(function(){clickDisabled = false;},130); // Prevents spamming and handles extra click events.
    },
    'click .optionText' (event) { // Click each preferences setting.
        var option = event.target.childNodes[0].nodeValue;
        if(modifyingInput[0] === 'w') {
            document.getElementById(modifyingInput).children[0].childNodes[0].nodeValue = option;
            var newSetting = Session.get("currentWork");
            newSetting.type = options.type.filter(function(names) {
                return names.alias === option;
            })[0].val;
            Session.set("currentWork", newSetting);
            console.log(newSetting);
            closeInput();
            toggleOptionMenu(false, modifyingInput);
            modifyingInput = null;
        } else if(modifyingInput.slice(0,3) === "cre") {
            document.getElementById(modifyingInput).value = option;
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

        toggleOptionMenu(false, modifyingInput);

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
        var thisWork = Session.get("currentWork");
        var no = [];
        if(thisWork.name === "") no.push("name");
        if(thisWork.dueDate === "") no.push("due date");
        if(thisWork.type === "") no.push("type");
        
        if(no.length === 0) {
            serverData = Session.get("currentWork");
            sendData("createWork");
            $(".overlay").velocity("fadeOut", 150);
            Session.set("currentWork", null);
        } else {
            var message = no.reduce(function(a, b) {
                return (b === no[no.length - 1]) ? a + ((no.length === 2) ? " and " : ", and ") + b : a + ", " + b;
            });
            sAlert.error("You are missing the " + message + "!", {
                effect: 'stackslide',
                position: 'top',
                timeout: 2000
            });
            return;
        } 
    },
    'click #workDelete' () {
        serverData = Session.get("currentWork")._id;
        sendData("deleteWork");
        $(".overlay").velocity("fadeOut", 150);
        Session.set("currentWork", null);
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
    'click .cWorkBottom .fa-thumbs-up' (event) {
        serverData = [event.target.parentNode.parentNode.parentNode.parentNode.getAttribute("workid"), "confirmations"]
        sendData("toggleWork");
    },
    'click .cWorkBottom .fa-exclamation-triangle' (event) {
        serverData = [event.target.parentNode.parentNode.parentNode.parentNode.getAttribute("workid"), "reports"]
        sendData("toggleWork");
    },
    'click #signout' () {
        $(".noScroll").velocity("fadeOut", 50);
        Session.set('sidebarMode','');
        document.getElementById('login-buttons-logout').click();
    }
});

Template.classesMode.helpers({
    thisClassWork() {
        var id = this._id;
        return Session.get("myWork").filter(function(work) {
            return work.classid === id;
        });
    }
});

// Other Functions

toggleOptionMenu = function(toggle, menu) {
    if(toggle) {
        $(".selectedOption").removeClass("selectedOption");
        $("#" + menu).next().css('opacity', 0)
        $("#" + menu).next().velocity("slideDown", 100);
        $("#" + menu).next().velocity(
            { opacity: 1 },
            { queue: false, duration: 50 }
        );
        optionOpen = [menu, toggle];
    } else {
        $("#" + menu).next().velocity("slideUp", {
            duration: 100,
            complete: function() {
                $("#" + menu).next().css("opacity", 0);
            }
        });
        optionOpen = [null, toggle]; 
    }
}

sendData = function(funcName) { // Call Meteor function, and do actions after function is completed depending on function.
    if(funcName === "editWork" || funcName === "createWork") {
        for(var key in serverData) {
            if(serverData[key] === true) serverData[key] = "";
        }
        
    }
    if(funcName === "editWork") workChanger = true;
    if(funcName === "editProfile") filterWork();
    Meteor.call(funcName, serverData, function(error, result) {
        if(funcName === "createWork") Session.set("currentWork", null);
        serverData = null;
        if (error !== undefined) {
            console.log(funcName);
            console.log(error);
            sAlert.error(error.error[1] || error.message, {
                effect: 'stackslide',
                position: 'top'
            });
        } else {
            if(funcName === "createClass") {
                var inputs = document.getElementsByClassName("creInput");
                for(var i = 0; i < inputs.length; i++) {
                    inputs[i].value = "";
                }
                toggleToMode("manageClass");
            }
        }
        document.getElementsByTagName("body")[0].style.color = Session.get("user").preferences.theme.textColor;
    });
}

function closeInput() { // Close a changeable input and change it back to span.
    var thisWork = Session.get("currentWork");
    var inputs = $(".clickModify");

    Session.set("restrictText", {});
    if(modifyingInput !== "wType") {
        $("#"+modifyingInput).css('cursor','pointer');
        $("#"+modifyingInput).css('background-color', 'rgba(0,0,0,0)');
    }

    thisWork.name = inputs[0].value;
    thisWork.dueDate = toDate(inputs[1].value);
    thisWork.description = inputs[2].value;
    thisWork.type = options.type.filter(function(names) {
        return names.alias === inputs[3].children[0].innerHTML;
    })[0].val;
    Session.set("currentWork", thisWork);

    if(!Session.get("newWork")) {
        var no = [];
        if(thisWork.name === "") no.push("name");
        if(thisWork.dueDate === "") no.push("due date");
        if(thisWork.type === "") no.push("type");

        if(no.length === 0) {
            serverData = Session.get("currentWork");
            sendData("editWork");
        } else {
            var message = no.reduce(function(a, b) {
                return (b === no[no.length - 1]) ? a + ((no.length === 2) ? " and " : ", and ") + b : a + ", " + b;
            });
            sAlert.error("You are missing " + message + "!", {
                effect: 'stackslide',
                position: 'top',
                timeout: 2000
            });
            return;
        } 
    }
}

var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

getReadableDate = function(date) { // Get readable date from Date constructor.
    return days[date.getDay()] + ", " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}

toDate = function(date) { // Turns formatted date back to Date constructor.
    date = date.substring(date.search(",") + 2, date.length);
    month = months.indexOf(date.substring(0, date.search(" ")));
    day = date.substring(date.search(" ") + 1, date.search(","));
    year = date.substring(date.search(",") + 2, date.length);
    return new Date(year, month, day, 0,0,0);
}

checkComplete = function(required, inputs) {
    var values = {};
    var no = [];
    for (var i = 0; i < inputs.length; i++) {
        var val = inputs[i].value;
        var where = inputs[i].getAttribute("form");
        if (val === "" && _.contains(required, where)) {
            no.push(where);
        }
        values[where] = val;
    }
    if (no.length > 0) { // Check missing fields.
        return [false,no.reduce(function(a, b) {
            return (b === no[no.length - 1]) ? a + ((no.length === 2) ? " and " : ", and ") + b : a + ", " + b;
        }), values];
    } else {
        return [true,"", values];
    }   
}

startDragula = function() {
    dragula([document.querySelector('#classesMode'), document.querySelector('#nonexistant')], {
        moves: function(el, container, handle) {
            return _.intersection(["classInfo"], handle.classList).length > 0;
        }
    })
    .on('drag', function() {
        dragging = true;  
    })
    .on('out', function(el) {
        var els = document.getElementsByClassName("classWrapper");
        if($(els[0]).hasClass("gu-transit")) return;
        dragging = false;
        clicked = false;
        var final = [];
        for (var i = 0; i < els.length; i++) {
            var classid = els[i].getElementsByClassName("creWork")[0].getAttribute("classid");
            final.push(classid);
        }
        Meteor.call("reorderClasses", final);
    });
};

getClasses = function(myClasses) {
    var array = [];
    var classDisp = Session.get("classDisp");
    for(var i = 0; i < myClasses.length; i++) {
        var classObj = {};
        if(myClasses[i] === Meteor.userId()) {
            classObj.name = "Personal";
            classObj.box = " owned";
            classObj.mine = false; // Actual value is reversed.
            classObj.subscribers = 1;
            classObj.status = true;
            classObj.admin = Meteor.userId();
            classObj._id = Meteor.userId();
        } else {
            classObj = classes.findOne({_id: myClasses[i]});
            if(classObj === undefined) return;
            var isAdmin = classObj.admin === Meteor.userId();
            classObj.box = (isAdmin) ?  " owned" : "";
            classObj.mine = (isAdmin) ? false : true; // Actual value is reversed
            classObj.subscribers = classObj.subscribers.length;
            classObj.teachershort = (classObj.teacher === undefined) ? "" : classObj.teacher.split(" ").slice(1);
        }

        classObj.selected = ((classDisp.indexOf(myClasses[i]) !== -1)) ? Session.get("user").preferences.theme.modeHighlight : "rgba(0,0,0,0)"; // Filter selected.
        array.push(classObj);
    }
    Session.set("myClasses", array);
}

updateWork = function(id, fields, type) {
    if(type === "added") {
        var allWork = Session.get("myWork").concat(Session.get("filterWork"));
        if(allWork.filter(function(work) {
            return work._id === id;
        }).length !== 0) return;
    }

    if(type === "remove" && Session.get("myWork").concat(Session.get("filterWork")).length === 0) return;
    if(type === "remove" && Session.get("myWork").concat(Session.get("filterWork")).filter(function(work) { // Removed work and exists in user data.
        return work._id === id;
    }).length !== 0) {
        Session.set("myWork", Session.get("myWork").filter(function(work) {
            return work._id !== id;
        }));
        Session.set("filterWork", Session.get("filterWork").filter(function(work) {
            return work._id !== id;
        }));
        return;
    }

    var workObj;

    if(type === "added") {
        workObj = Object.assign({}, fields, {_id: id})
    } else if(type === "changed") {
        workObj = work.findOne({_id: id});
    }

    if(Meteor.users.findOne({_id: workObj.creator}) === undefined) return;
    if(Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) && !_.contains(Session.get("user").classes, workObj["class"])) return;

    workObj.classid = workObj.class;

    workObj.shortname = (workObj.name.length <= 20) ? workObj.name : workObj.name.substring(0,20) + "...";
    workObj.className = (workObj.classid === Meteor.userId()) ? "Personal" : classes.findOne({_id: workObj.classid}).name;

    workObj.dateWord = (!(Meteor.Device.isPhone() || Meteor.Device.isTablet())) ? 
    moment(workObj.dueDate).calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'MMMM Do'
    }) :
    moment(workObj.dueDate).calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] ddd[.]',
        sameElse: 'MMMM Do'
    });

    workObj.shortdesc = (workObj.description === undefined) ? "" : (workObj.description.length <= 30 ) ? workObj.description : workObj.description.substring(0,30) + "...";

    if (workObj.dateWord === "Today") { // Font weight based on date proximity.
        workObj.cardDate = "600";
    } else if (workObj.dateWord === "Tomorrow") {
        workObj.cardDate = "400";
    }

    workObj.confirmationLength = workObj.confirmations.length; // Counts the number of confirmations and reports for a particular work.
    workObj.reportLength = workObj.reports.length;
    workObj.confirmed = (_.contains(workObj.confirmations, Meteor.userId())) ? "#27A127" : "";
    workObj.reported = (_.contains(workObj.reports, Meteor.userId())) ? "#FF1A1A" : "";

    workObj.typeColor = workColors[workObj.type];

    workObj.creatorname = Meteor.users.findOne({
        _id: workObj.creator
    }).profile.name;

    var normalColor = Session.get("user").preferences.theme.text;
    // Ratio color handling
    /*var conf = workObj.confirmations.length;
    var repo = workObj.reports.length;
    var ratio = conf / repo;
    
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
    }*/

    workObj.doneRatio = normalColor;

    var myWork;
    if(type === "added") {
        myWork = Session.get("myWork");
        myWork.push(workObj);
    } else if(type === "changed") {
        myWork = Session.get("myWork").filter(function(work) {
            return work._id !== id;
        });
        myWork.push(workObj);
        if(!Session.equals("currentWork", null) && Session.get("currentWork")._id === id) {  //Notification beta, probably rework.
            Session.set("currentWork", workObj);
            /*if($(".overlay").css("display") !== "none") { // If currently viewing work.
                var message = Object.keys(fields)[0].replace("dueDate", "due date");
                if(!workChanger && message !== "comments" && message !== "done" && message !== "confirmations") sAlert.success("The " + message + " of this work was updated by someone else!", {
                    effect: 'stackslide',
                    position: 'top',
                    timeout: 1500
                });
                workChanger = false;
            }*/
        }
    }
        
    Session.set("myWork", myWork);
}

filterWork = function() {
    var classDisp = Session.get("classDisp");
    var typeFilter = Session.get("typeFilter");
    var hideTime = Session.get("user").preferences.timeHide;

    var allWork = Session.get("filterWork").concat(Session.get("myWork"));
    var hideWork = [];
    var displayWork = [];
    
    _.each(allWork, function(workObj) {
        var notInClassFilter = classDisp.length !== 0 && !_.contains(classDisp, workObj.classid);
        var notInTypeFilter = typeFilter.length !== 0 && !_.contains(typeFilter, workObj.type);
        var pastHideDate = hideTime !== 0 && (moment().subtract(hideTime, 'days'))._d > (moment(workObj.dueDate))._d;
        var markedDone = Session.get("user").preferences.done && !(Meteor.Device.isPhone() || Meteor.Device.isTablet()) && _.contains(workObj.done, Meteor.userId());
        var reported = false; // Temp, working on reporting.
        //var reported = (workObj.reportLength / (workObj.reportLength + workObj.confirmationLength)) > 0.7; // Over 70% are reports

        if(notInClassFilter || notInTypeFilter || pastHideDate || markedDone || reported) {
            hideWork.push(workObj);
        } else {
            displayWork.push(workObj);
        }
    });
    Session.set("myWork", displayWork.sort(function(a,b) { // Display work.
        return Date.parse(a.dueDate) - Date.parse(b.dueDate);
    }));
    Session.set("filterWork", hideWork); // Not displayed

    calendarEvents();
    $("#fullcalendar").fullCalendar("removeEvents");
    $("#fullcalendar").fullCalendar("addEventSource", Session.get("calendarEvents"));
}

function calendarEvents() {
    var events = [];
    var myWork = Session.get("myWork");
    for(var i = 0; i < myWork.length; i++) {
        var work = myWork[i];
        var currClass = classes.findOne({ _id: work.classid});
        var inRole = false;

        if (work.class === Meteor.userId() ||
            Meteor.userId() === work.creator ||
            Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
            currClass.banned.indexOf(Meteor.userId()) !== -1
           ) inRole = true;

        events.push({
            id: work._id,
            start: work.dueDate.toISOString().slice(0, 10),
            title: work.name,
            backgroundColor: workColors[work.type],
            borderColor: "#444",
            startEditable: inRole,
            className: work.type + " workevent " + work.class
        });
    }
    Session.set("calendarEvents", events);
}

function notifyMe() {

}
