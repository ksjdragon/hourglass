import {
    Template
} from 'meteor/templating';

import './main.html';

var load = true;
var calWorkOpen = null;
var calWorkDate = null;

var openValues = {
    "menu": "-25%",
    "options": "-20%"
};

//Sets colors for different assignment statuses
var workColors = {
    "normal": "#2E4F74",
    "quiz": "#409333",
    "test": "#AD3C44",
    "project": "#D8831A",
    "other": "#852E6D"
};

//Creates variables for due dates

var ref = {
    "1 Day":1,
    "2 Days":2,
    "1 Week":7,
    "1 Month":30,
    "Never":0,
    "Yes":true,
    "No":false
};

// Reactive variables.
Session.set("calendarClasses", null);
Session.set("sidebar", null); // Status of sidebar
Session.set("newWork",null); // If user creating new work.
Session.set("currentWork",null); // Stores current selected work info.
Session.set("currentReadableWork",null); // Stores readable selected work info.
Session.set("modifying",null); // Stores current open input.
Session.set("noclass",null); // If user does not have classes.
Session.set("calCreWork",null); // If user is creating a work from calendar.
Session.set("classDisp",[]); // Stores current filter for classes.
Session.set("classDispHover",null); // Stores current hovered filter.
Session.set("refetchEvents",null); // Stores whether to get calendar events again.
Session.set("commentRestrict",null); // Stores text for comment character restriction.

Template.registerHelper('divColor', (div) => { // Reactive color changing based on preferences. Colors stored in themeColors.
    if(Meteor.user() === null) return;
    if(Meteor.user().profile.preferences === undefined) return;
    return themeColors[Meteor.user().profile.preferences.theme][div];
});

Template.registerHelper('textColor', () => { // Reactive color for text.
    if(Meteor.user() === null) return;
    if(Meteor.user().profile.preferences === undefined) return; 
    document.getElementsByTagName("body")[0].style.color = themeColors[Meteor.user().profile.preferences.theme].text;
    return;
});

Template.registerHelper('overlayDim', (part) => { // Gets size of the overlay container.
    if(Meteor.user() === null) return;
    var dim = [window.innerWidth * 0.25, window.innerHeight * 0.2];
    var width = "width:" + dim[0].toString() + "px;";
    var height = "height:" + dim[1].toString() + "px;";
    var margin = "margin-left:" + (-dim[0] / 2).toString() + "px;";
    var bg = "background-color:" + themeColors[Meteor.user().profile.preferences.theme].header + ";";
    return width + height + margin + bg;
});

Template.registerHelper('myClasses', () => { // Gets all classes and respective works.
    if(Meteor.user() === null) return;
    if (Meteor.user().profile.classes === undefined || Meteor.user().profile.classes.length === 0) { // Null checking.
        Session.set("noclass",true); // Makes sure to display nothing.
        return [];
    } else {
        var array = [];
        var courses = Meteor.user().profile.classes;
        var classDisp = Session.get("classDisp"); // Get sidebar class filter.
        var hide = Meteor.user().profile.preferences.timeHide;

        for(var i = 0; i < courses.length; i++) { // For each user class.
            found = classes.findOne({_id:courses[i]});
            found.subscribers = found.subscribers.length;
            found.mine = true;
            if(found.admin === Meteor.userId()) { // If user owns this class.
                found.box = " owned";
                found.mine = false;
            }
            if(classDisp.indexOf(courses[i]) !== -1) found.selected = true; // Filter selected.
            array.push(found);

            var thisWork = work.find({class: courses[i]}).fetch();

            if(classDisp.length !== 0 && classDisp.indexOf(found._id) === -1) { // Filter classes based on filter.
                array[i].thisClassWork = [];
                continue;
            }
	
            for(var j = 0; j < thisWork.length; j++) { // For each work in class.
                if(hide !== 0) { // Time to hide isn't never.
                    var due = (moment(thisWork[j].dueDate))["_d"];
                    var offset = (moment().subtract(hide,'days'))["_d"];
                    if(offset > due) { // If due is before hide days before today
                        thisWork[j] = "no";
                        j = 0;
                    }
                }
                if(thisWork[j] !== "no" && Meteor.user().profile.preferences.done) { // If done filter is true
                    if(thisWork[j].done.indexOf(Meteor.userId()) !== -1) { // If user marked this work done.
                        thisWork[j] = "no";
                        j = 0;
                    }
                }
			
            }
            while(thisWork.indexOf("no") !== -1) thisWork.splice(thisWork.indexOf("no"),1); // Splice all filtered works.

            for(var j = 0; j < thisWork.length; j++) {
                thisWork[j].realDate = thisWork[j].dueDate;
                thisWork[j].dueDate = moment(thisWork[j].dueDate).calendar(null, {
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    nextWeek: 'dddd',
                    lastDay: '[Yesterday]',
                    lastWeek: '[Last] dddd',
                    sameElse: 'MMMM Do'
                });

                if(thisWork[j].dueDate === "Today") { // Font weight based on date proximity.
                    thisWork[j].cardDate = "600";
                } else if(thisWork[j].dueDate === "Tomorrow") {
                    thisWork[j].cardDate = "400";
                }
                thisWork[j].typeColor = workColors[thisWork[j].type];

				thisWork[j].confirmationLength = thisWork[j].confirmations.length // Counts the number of confirmations and reports for a particular work.
				thisWork[j].reportLength = thisWork[j].reports.length
			
                var hoverHighlight = Session.get("classDispHover"); // Highlight/scale related class works on hover.
                if(hoverHighlight !== null && hoverHighlight === found._id) {
                    thisWork[j].scale = "-ms-transform: scale(1.12)-webkit-transform: scale(1.12);transform: scale(1.12)";
                } else {
                    thisWork[j].scale = "";
                }
            }
            array[i].thisClassWork = thisWork;
        }
        Session.set("noclass",false);
        Session.set("calendarClasses", array);
        Session.set("refetchEvents",true);
        return array;
    }
});

Template.registerHelper('pref', (val) => { // Obtains all user preferences.
    var preferences = Meteor.user().profile.preferences;
    if(val === 'timeHide' || val === 'done') {
        var invert = _.invert(ref);
        return invert[preferences[val]];
    }
    return preferences[val].charAt(0).toUpperCase() + preferences[val].slice(1);
});

Template.main.helpers({
    schoolName() { // Finds the name of the user's school.
        if(Meteor.user().profile.school === undefined) return;
        return " - " + Meteor.user().profile.school;
    },
    iconColor(icon) { // Sidebar status color
        if (Session.get("sidebar") === icon + "Container") {
            return themeColors[Meteor.user().profile.preferences.theme].statusIcons;
        } else if (Session.get("sidebar") === "both") {
            return themeColors[Meteor.user().profile.preferences.theme].statusIcons;
        } else {
            return;
        }
    },
    defaultMode() { //Loads the default display mode for user.
        if(load) {
            Session.set("mode",Meteor.user().profile.preferences.mode);
            load = false;
        }
        return;
    },
    bgSrc() { // Adjusts for different, larger screen sizes.
        var dim = [window.innerWidth, window.innerHeight];
        var pic = "Backgrounds/"+themeColors[Meteor.user().profile.preferences.theme].background;
        return pic;
    },
    menuStatus() { // Status of of menu sidebar.
        if (Session.get("sidebar") === "menuContainer") {
            return "0%";
        } else if (Session.get("sidebar") === "both") {
            return "0%";
        } else {
            return openValues.menu;
        }
    },
    optionsStatus() { // Status of options sidebar.
        if (Session.get("sidebar") === "optionsContainer") {
            return "0%";
        } else if (Session.get("sidebar") === "both") {
            return "0%";
        } else {
            return openValues.options;
        }
    },
    modeStatus(status) { // Color status of display modes.
        if (status === Session.get("mode")) {
            return themeColors[Meteor.user().profile.preferences.theme].highlightText;
        } else {
            return;
        }
    },
    currMode(name) { // Status of display mode.
        var mode = Session.get("mode");
        if (name === mode) {
            return true;
        } else {
            return false;
        }
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

                for(var i = 0; i < userClasses.length; i++) {
                    var works = userClasses[i].thisClassWork;
                    for(var j = 0; j < works.length; j++) {
                        var work = works[j];
                        var currClass = classes.findOne({_id: work.class})
                        var inRole = false;

                        if(Meteor.userId() === work.creator ||
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
                            className: "workevent "+work.class,
                        }) 
                    }
                }
                callback(events);
            },
            eventDrop: function(event, delta, revertFunc) { // When user drops from click-dragging.
                var current = work.findOne({_id:event.id});
                var date = event.start.format().split("-");
                current.dueDate = new Date(date[0],parseInt(date[1])-1,date[2],11,59,59);
                serverData = current;
                sendData("editWork");
            },
            eventClick: function(event, jsEvent, view) { // On-click for work.
                Session.set("newWork",false);
                var thisWork = work.findOne({_id:event.id})
                Session.set("currentWork",thisWork);
                var thisReadWork = formReadable(thisWork);
                Session.set("currentReadableWork",thisReadWork);
                openDivFade(document.getElementsByClassName("overlay")[0]);
            },
            dayClick: function(date, jsEvent, view) { // On-click for each day.
                if(jsEvent.target.className.includes("fc-past")) return;
                Session.set("calCreWork", true);
                calWorkDate = date.format();
                calWorkOpen = true;
                Session.set("newWork", true);
                Session.set("sidebar","menuContainer");
            }
        };
    },
    calCenter() { // Centers the calendar
        var width = window.innerWidth * 0.85;
        return "width:" + width.toString() + "px;margin-left:" + (0.5 * window.innerWidth - 0.5 * width).toString() + "px;";
    },
    calColor() { // Sets the color of the calendar according to theme
        return "color:"+themeColors[Meteor.user().profile.preferences.theme].calendar;
    },
    calbg() { //Sets size of the calendar
        var width = window.innerWidth * 0.865;
        var height = window.innerHeight * 0.76;
        return "width:" + width.toString() + "px;height:" + height.toString() + "px;margin-left:" + (0.5 * window.innerWidth - 0.5 * width).toString() + "px;margin-top:" + (0.47 * window.innerHeight - 0.5 * height).toString() + "px";
    },
    calCreWork() { // Display instructions for creating a work.
        if(Session.get("calCreWork")) return true;
        return false;
    },
    filterOn() {
        if(Session.get("classDisp").length !== 0) return true;
        return false;
    },
    highlight() { // Calendar highlight/scale option.
        var hoverHighlight = Session.get("classDispHover");
        var works = document.getElementsByClassName("workevent");
        var work = $('.workevent');
        if(hoverHighlight === null) {
            work.css('-webkit-transform','');
            work.css('-ms-transform','');
            work.css('transform','');
            return;
        }

        for(var i = 0; i < works.length; i++) {
            var id = works[i].className;
            var index = id.indexOf("workevent");
            id = id.substring(index+10,index+27);
            if(id === hoverHighlight) {
                works[i].style.webkitTransform = 'scale(1.12)';
                works[i].style.msTransform = 'scale(1.12)';
                works[i].style.transform = 'scale(1.12)';
            } else {
                works[i].style.webkitTransform = '';
                works[i].style.msTransform = '';
                works[i].style.transform = '';
            } 
        }
        return;
    },
    workCenter() { // Centers work overlay.
        var w = window.innerWidth * 0.3;
        var h = window.innerHeight * 0.7;
        return "width:"+w.toString()+"px;height:"+h.toString()+"px;margin-left:"+-0.5*w.toString()+"px;margin-top:"+-0.5*h.toString()+"px";
    },
    commentDim() { // Dimensions of comment container.
        var work = Session.get("currentWork");
        if(Session.get("newWork") === null || work === null) return;
        if(Session.get("newWork") || work.comments.length <= 3) return;
        return 0.23*window.innerHeight.toString() + "px";
    },
    work(value) { // Returns the specified work value.
        if(Session.get("currentWork") === null) return;
        return Session.get("currentReadableWork")[value];
    },
    workType() { // Returns color for respective work type.
        if(Session.get("currentWork") === null) return;
        if(Session.get("currentWork").type === undefined) return;
        type = Session.get("currentWork").type;
        if(type.includes("edit")) {
            return;
        } else {
            return workColors[type];
        }
    },
    commentLength() { // Returns characters left for comment length.
        return Session.get("commentRestrict");
    },
    newWork() { // If user is creating a new work.
        return Session.get("newWork");
    },
    inRole() { // Checks correct permissions.
        if(Session.get("currentWork") === null) return;
        if(Session.get("newWork")) {
            return true;
        } else {
            var currClass = classes.findOne({_id: Session.get("currentWork")["class"]})
            if(Meteor.userId() === Session.get("currentWork").creator || 
               Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
               currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
               currClass.banned.indexOf(Meteor.userId()) !== -1
              ) return true;
        }
    },
    refetchEvents() {
        if(Session.get("refetchEvents")) {
            $("#fullcalendar").fullCalendar( 'refetchEvents' );
            Session.set("refetchEvents",null);
    }   }
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

        if (e !== Session.get("sidebar") && // Sidebar closing.
        !e.includes("fa-cog") &&
        !e.includes("fa-bars") &&
        !document.getElementById("menuContainer").contains(event.target) &&
        !document.getElementById("optionsContainer").contains(event.target)) {
            if(Session.get("calCreWork")) {
                if(!calWorkOpen) {
                    Session.set("calCreWork",false);
                    Session.set("sidebar",null);
                }
                calWorkOpen = false;
            } else {
                Session.set("sidebar",null);
            } 
        }

        if(e === "overlay") { // Overlay closing.
            closeDivFade(document.getElementsByClassName("overlay")[0]);
            if(!Session.get("newWork")) {
                if(getHomeworkFormData() === null) return;
                serverData = Session.get("currentWork");
                sendData("editWork");
                document.getElementById("workComment").value = "";
            }
            Session.set("newWork",null);
            Session.set("currentWork",null);
            Session.set("currentReadableWork",null);
            $('.req').css("color","");
            Session.set("commentRestrict",null);
        }

        if (!event.target.className.includes("radio") && // Dropdown closing.
            !event.target.parentNode.className.includes("workOptions") &&
            !event.target.parentNode.className.includes("prefOptions") &&
            event.target.readOnly !== true) {
            if(Session.equals("sidebar","optionsContainer") || Session.equals("sidebar","both")) {
                var radio = "prefOptions";
            } else {
                var radio = "workOptions";
            }
            for (var i = 0; i < document.getElementsByClassName(radio).length; i++) {
                try {
                    closeDivFade(document.getElementsByClassName(radio)[i]);
                } catch (err) {}
            }
        }
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
    'click .classes' () { // Click classes mode button.
        if (Session.get("mode") === "classes") return;
        var modeHolder = document.getElementById("mainBody");
        closeDivFade(modeHolder);
        setTimeout(function() {
            Session.set("mode", "classes");
            openDivFade(modeHolder);
        }, 300);
        Session.set("sidebar",null); // Closes all sidebars.
    },
    'click .calendar' () { // Click calendar mode button.
        if (Session.get("mode") === "calendar") return;
        var modeHolder = document.getElementById("mainBody");
        closeDivFade(modeHolder);
        setTimeout(function() {
            Session.set("mode", "calendar");
            openDivFade(modeHolder);
        }, 300);
        Session.set("sidebar",null); // Closes all sidebars.
    },
    'click .creWork' (event) { // Cick add work button.
        if(event.target.className !== "creWork") {
            var attr = event.target.parentNode.getAttribute("classid");
        } else {
            var attr = event.target.getAttribute("classid");
        }
        Session.set("newWork", true);
        Session.set("currentReadableWork", // Default readable work.
        {
              name:"Name | Click here to edit...",
              class:attr,
              dueDate:"Click here to edit...",
              description:"Click here to edit...",
              type:"Click here to edit..."
        });
        Session.set("currentWork",{class:attr});
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },   
    'click .workCard' (event) { // Display work information on work card click.
        var dom = event.target;
        while(event.target.className !== "workCard") event.target = event.target.parentNode;
        workid = event.target.getAttribute("workid");

        Session.set("newWork",false);
        var thisWork = work.findOne({_id:workid});
        Session.set("currentWork",thisWork);
        var thisReadWork = formReadable(thisWork);
        Session.set("currentReadableWork",thisReadWork);

        if(!Session.get("newWork") && !document.getElementById("optionsContainer").contains(event.target)) {
            var currClass = classes.findOne({_id: Session.get("currentWork")["class"]});
            if(!(Meteor.userId() === Session.get("currentWork").creator || // If user has permission.
            Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
            currClass.banned.indexOf(Meteor.userId()) !== -1)) {
                var inputs = $('#editWork .change').css("cursor","default");
            };
        }
        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    // HANDLING INPUT CHANGING
    'click .change' (event) { // Click changable inputs. Creates an input where the span is.
        if(!Session.get("newWork") && !document.getElementById("optionsContainer").contains(event.target)) {
            var currClass = classes.findOne({_id: Session.get("currentWork")["class"]});
            if(!(Meteor.userId() === Session.get("currentWork").creator || // If user has permission.
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
        if(event.target.id !== "workDate") input.value = ele.childNodes[0].nodeValue;
        input.className = "changeInput";

        input.style.width = "70%";
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
        if(ele.id === "workDate") {
            input.className += " form-control";
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
        if(!Session.get("newWork") && !document.getElementById("optionsContainer").contains(event.target)) {
            var currClass = classes.findOne({_id: Session.get("currentWork")["class"]});
            if(!(Meteor.userId() === Session.get("currentWork").creator || 
            Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
            currClass.banned.indexOf(Meteor.userId()) !== -1
            )) return;
        }

        var op = event.target;
        if(Session.equals("sidebar","optionsContainer") || Session.equals("sidebar","both")) {
            var radio = "prefOptions";
        } else {
            var radio = "workOptions";
        }
        try {
            for (var i = 0; i < document.getElementsByClassName(radio).length; i++) { // Close any previously open menus.
                var curr = document.getElementsByClassName(radio)[i];
                if(curr.childNodes[1] !== op.parentNode.parentNode.childNodes[3].childNodes[1]) {
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
        try {
            closeInput(modifyingInput);
        } catch (err) {}

        closeDivFade(p.parentNode);
        input.focus();
    },
    'click .prefOptionText' (event) { // Click each preferences setting.
        var modifyingInput = Session.get("modifying");
        var p = event.target;
        var input = p.parentNode.parentNode.childNodes[1].childNodes[5];
        input.value = p.childNodes[0].nodeValue;
        try {
            closeInput(modifyingInput);
        } catch (err) {}

        closeDivFade(p.parentNode);
        input.focus();
    },
    'keydown' (event) { // Enter to close input.
        var modifyingInput = Session.get("modifying");
        if (event.keyCode == 13 && modifyingInput != "workDesc") {
            try {
                closeInput(modifyingInput);
            } catch (err) {}
        }
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
        workId = Session.get("currentWork")._id;
        var input = document.getElementById('workComment');
        comment = input.value;
        input.value = "";
        Session.set("commentRestrict",null);
        if (comment !== "") {
            document.getElementById('workComment').value = "";
            Meteor.call('addComment', [comment, workId], function(err,result) {
                var thisWork = work.findOne({_id:workId});
                Session.set("currentWork",thisWork);
                var thisReadWork = formReadable(thisWork);
                Session.set("currentReadableWork",thisReadWork);
            });
        }
    },
    'click #workSubmit' () { // Click submit work to create a work.
        if(getHomeworkFormData() === null) return; // Makes sure to check valid homework.
        serverData = Session.get("currentWork");
        if(Session.get("newWork")) {
            sendData("createWork");
        } else {
            sendData("editWork");
        }
        Session.set("newWork",null);
        closeDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'click #workDelete' () {
        serverData = Session.get("currentWork")._id;
        sendData("deleteWork");
        closeDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'keyup #workComment' (event) { // Restrict length on comment.
        var chars = 200-event.target.value.length;
        document.getElementById("commentRestrict").style.color = "#7E7E7E";
        if(chars === 200) { // Don't display if nothing in comment.
            Session.set("commentRestrict","");
            return;
        } else if(chars === 0) {
            document.getElementById("commentRestrict").style.color = "#FF1A1A"; // Make text red if 0 characters left.
        }
        Session.set("commentRestrict", "Characters left: " + chars.toString());
        
    }, 
    'click #markDone' () { // Click done button.
        serverData = [Session.get("currentWork")._id, "done"]
        sendData("toggleWork");
    },
    'click #markConfirm' () { // Click confirm button.
        serverData = [Session.get("currentWork")._id, "confirmations"]
        sendData("toggleWork");
    },
    'click #markReport' () { // Click report button.
        serverData = [Session.get("currentWork")._id, "reports"]
        sendData("toggleWork");
    },
    // CLASS FILTERS
    'click .sideClass' (event) { // Click class list in sidebar.
        var div = event.target;
        while(div.getAttribute("classid") === null) div = div.parentNode;
        var classid = div.getAttribute("classid");

        if(Session.get("calCreWork")) { // If creating work from calendar.
            Session.get("calCreWork",null);
            Session.set("sidebar",null);

            var date = calWorkDate.split("-");
            var date = new Date(date[0],parseInt(date[1])-1,date[2],11,59,59);
            Session.set("newWork", true);
            Session.set("currentReadableWork",
            {
                  name:"Name | Click here to edit...",
                  class:classid,
                  dueDate:getReadableDate(date),
                  description:"Click here to edit...",
                  type:"Click here to edit..."
            });
            Session.set("currentWork",{class:classid,dueDate:date});
            openDivFade(document.getElementsByClassName("overlay")[0]);  
        } else { // Normal clicking turns on filter.
            var array = Session.get("classDisp");
            if(array.indexOf(classid) !== -1) {
                array.splice(array.indexOf(classid),1);
            } else {
                array.push(classid);
            }
            Session.set("classDisp",array);
        }
    },
    'click #disableFilter' () {
        Session.set("classDisp",[]);
    },
    'mouseover .sideClass' (event) { // Highlight/scale filter on-hover.
        if(event.target.className !== "sideClass") {
            var div = event.target.parentNode;
        } else {
            var div = event.target;
        }
        while(div.getAttribute("classid") === null) div = div.parentNode;
        var classid = div.getAttribute("classid");
        Session.set("classDispHover",classid);
    },
    'mouseleave .sideClass' (event) { // Turn off highlight/scale filter on-leave.
        if(event.target.className !== "sideClass") {
            var div = event.target.parentNode;
            if(div.contains(event.target)) return;
        }
        Session.set("classDispHover",null);
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
    Meteor.call(funcName, serverData , function(err,result) {
        if(funcName === "toggleWork") {
            var workId = Session.get("currentWork")._id;
            var thisWork = work.findOne({_id:workId});
            Session.set("currentWork",thisWork);
            var thisReadWork = formReadable(thisWork);
            Session.set("currentReadableWork",thisReadWork);
        }
    });
}

function closeInput(modifyingInput) { // Close a changeable input and change it back to span.
    var input = document.getElementById(modifyingInput + "a");
    var span = document.getElementById(modifyingInput);
    if(Session.equals("sidebar","optionsContainer") || Session.equals("sidebar","both")) {
        var color = "#000";
    } else {
        var color = "#8C8C8C";
    }
    span.style.color = color;
    input.parentNode.removeChild(input);
    try {
        var restrict = document.getElementById("restrict");
        restrict.parentNode.removeChild(restrict);
    } catch (err) {}
    if (input.value === "") { // If input has nothing.
        span.childNodes[0].nodeValue = "Click here to edit...";
    } else {
        span.childNodes[0].nodeValue = input.value;
    }
    span.style.display = "initial";
    Session.set("modifying", null);

    if(Session.equals("sidebar","optionsContainer") || Session.equals("sidebar","both")) { // Close depending on work or preferences.
        serverData = getPreferencesData();
        sendData("editProfile");
    } else if(!Session.get("newWork")) {
        if(getHomeworkFormData() === null) return;
        serverData = Session.get("currentWork");
        sendData("editWork");
    }
}

function getHomeworkFormData() { // Get all data relating to work creation.
    var inputs = document.getElementsByClassName("req");
    var stop;
    for(var i = 0; i < inputs.length; i++) {
        var value = inputs[i].childNodes[0].nodeValue;
        if(value.includes("Click here to edit")) {
            inputs[i].childNodes[0].nodeValue = "Missing field";
            inputs[i].style.color = "#FF1A1A";
            stop = true;
        }
    }
    if(stop) return null;

    var data = Session.get("currentWork");
    data.name = document.getElementById("workName").childNodes[0].nodeValue;
    data.dueDate = toDate(document.getElementById("workDate").childNodes[0].nodeValue);
    data.description = document.getElementById("workDesc").childNodes[0].nodeValue;
    data.type = document.getElementById("workType").childNodes[0].nodeValue.toLowerCase();

    Session.set("currentWork", data);
    var readableData = formReadable(data);
    Session.set("currentReadableWork", readableData);
}

function getPreferencesData() { // Get all data relating to preferences.
    var profile = Meteor.user().profile;
    var options = {
        "theme":document.getElementById("prefTheme").childNodes[0].nodeValue.toLowerCase(),
        "mode":document.getElementById("prefMode").childNodes[0].nodeValue.toLowerCase(),
        "timeHide":ref[document.getElementById("prefHide").childNodes[0].nodeValue],
        "done":ref[document.getElementById("prefDone").childNodes[0].nodeValue]
    };
    profile.preferences = options;
    return profile;
}

var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getReadableDate(date) { // Get readable date from Date constructor.
    return days[date.getDay()]+", "+months[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
}

function toDate(date) { // Turns formatted date back to Date constructor.
    date = date.substring(date.search(",")+2,date.length);
    month = months.indexOf(date.substring(0,date.search(" ")));
    day = date.substring(date.search(" ")+1,date.search(","));
    year = date.substring(date.search(",")+2,date.length);
    return new Date(year,month,day,11,59,59);
}

function formReadable(input) { // Makes work information readable by users.
    input.dueDate = getReadableDate(input.dueDate);
    input.type = input.type[0].toUpperCase() + input.type.slice(1);

    if(!Session.get("newWork")) {
        if(input.done.indexOf(Meteor.userId()) !== -1) { // If user marked as done.
            input.doneCol = "#27A127";
            input.doneText = "Done!";
        } else {
            input.doneCol = "";
            input.doneText = "Mark done";
        }

        for(var i = 0; i < input.done.length; i++) { // Display users who marked as done.
            input.done[i] = {"user":Meteor.users.findOne({_id:input.done[i]}).profile.name};
        }

        if(input.confirmations.indexOf(Meteor.userId()) !== -1) { // If user confirmed.
			input.userConfirm = "#27A127";
        } else {
            input.userConfirm = "";
        }

        if(input.reports.indexOf(Meteor.userId()) !== -1) { // If user reported.
            input.userReport = "#FF1A1A";
        } else {
            input.userReport = "";
        }

        input.confirmations = input.confirmations.length;
        input.reports = input.reports.length;

        var comments = input.comments;
        var resort = [];
        if(!Session.get("newWork")) { // Don't display comments if user is creating work.
            for(var k = 0; k < comments.length; k++) {
                var re = comments.length-k-1;
                resort[re] = {"comment":comments[k].comment,"date":null,"user":null};
                resort[re].user = Meteor.users.findOne({_id:comments[k].user}).profile.name;
                resort[re].date =  moment(comments[k].date).fromNow();
            }
            input.comments = resort;
        }
    }
    return input;
}
