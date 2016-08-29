import {
    Template
} from 'meteor/templating';

import './main.html';

var load = true;

var openValues = {
    "menu": "-25%",
    "options": "-20%"
};

Session.set('themeColors', {
    "light": {
        "background": "White.jpg",
        "header": "#EBEBEB",
        "sidebar": "#65839A",
        "funcButton": "#849CAE",
        "statusIcons": "#33ADFF",
        "highlightText": "#FF1A1A",
        "cards": "#FEFEFE",
        "classes":"#EBEBEB",
        "calendar": "#000",
        "text": "#000"
    },
    "dark": {
        "background": "Black.jpg",
        "header": "#373A56",
        "sidebar": "#35435D",
        "funcButton": "#5d75A2",
        "statusIcons": "#33ADFF",
        "highlightText": "#FF1A1A",
        "cards": "#151A2B",
        "classes":"#46396E",
        "calendar": "#000",
        //30313B
        "text": "#F6F6F6" 
    }
});

var workColors = {
    "normal": "#2E4F74",
    "quiz": "#409333",
    "test": "#AD3C44",
    "project": "#E6E619",
    "other": "#852E6D"
};

var defaults = {
    "theme":"light",
    "mode":"classes",
    "timeHide":1,
    "done": true
};

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
Session.set("calendarclasses", null); //  
Session.set("sidebar", null);
Session.set("newWork",null);
Session.set("currentWork",null);
Session.set("currentReadableWork",null);
Session.set("modifying",null);
Session.set("serverData",null);
Session.set("noclass",null);
Session.set("calCreWork",null);
Session.set("calWorkDate",null);
Session.set("classDisp",[]);
Session.set("classDispHover",null);
Session.set("commentRestrict",null);

Template.registerHelper('divColor', (div) => { // Reactive color changing based on preferences. Colors stored in Session.get("themeColors").
    return Session.get("themeColors")[Meteor.user().profile.preferences.theme][div];
});

Template.registerHelper('textColor', () => { // Reactive color for text. 
    document.getElementsByTagName("body")[0].style.color = Session.get("themeColors")[Meteor.user().profile.preferences.theme].text;
    return;
});

Template.registerHelper('overlayDim', (part) => { // Gets size of the overlay container.
    var dim = [window.innerWidth * 0.25, window.innerHeight * 0.2];
    var width = "width:" + dim[0].toString() + "px;";
    var height = "height:" + dim[1].toString() + "px;";
    var margin = "margin-left:" + (-dim[0] / 2).toString() + "px;";
    var bg = "background-color:" + Session.get("themeColors")[Meteor.user().profile.preferences.theme].header + ";";
    return width + height + margin + bg;
});

Template.registerHelper('myClasses', () => { 
    if (Meteor.user().profile.classes === undefined || Meteor.user().profile.classes.length === 0) {
        Session.set("noclass",true);
        return [];
    } else {
        var array = [];
        var courses = Meteor.user().profile.classes;
        var classDisp = Session.get("classDisp");
        var hide = Meteor.user().profile.preferences.timeHide;
        for(var i = 0; i < courses.length; i++) {
            found = classes.findOne({_id:courses[i]});
            found.subscribers = found.subscribers.length;
            found.mine = true;
            if(found.admin === Meteor.userId()) {
                found.box = " owned";
                found.mine = false;
            }
            if(classDisp.indexOf(courses[i]) !== -1) found.selected = true;
            array.push(found);

            var thisWork = work.find({class: courses[i]}).fetch();

            if(classDisp.length !== 0 && classDisp.indexOf(found._id) === -1) {
                array[i].thisClassWork = [];
                continue;
            }

            for(var j = 0; j < thisWork.length; j++) {
                if(hide !== 0) {
                    var due = (moment(thisWork[j].dueDate))["_d"];
                    var today = (moment().subtract(hide,'days'))["_d"];
                    if(today > due) {
                        thisWork[j] = "no";
                        j = 0;
                    }
                }
                if(thisWork[j] !== "no" && Meteor.user().profile.preferences.done) {
                    if(thisWork[j].done.indexOf(Meteor.userId()) !== -1) {
                        thisWork[j] = "no";
                        j = 0;
                    }
                }
            }
            while(thisWork.indexOf("no") !== -1) thisWork.splice(thisWork.indexOf("no"),1);

            for(var j = 0; j < thisWork.length; j++) {   
                thisWork[j].dueDate = moment(thisWork[j].dueDate).calendar(null, {
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    nextWeek: 'dddd',
                    lastDay: '[Yesterday]',
                    lastWeek: '[Last] dddd',
                    sameElse: 'MMMM Do'
                });

                if(thisWork[j].dueDate === "Today") {
                    thisWork[j].cardDate = "600";
                } else if(thisWork[j].dueDate === "Tomorrow") {
                    thisWork[j].cardDate = "400";
                }
                thisWork[j].typeColor = workColors[thisWork[j].type];

                var hoverHighlight = Session.get("classDispHover");
                if(hoverHighlight !== null && hoverHighlight === found._id) {
                    thisWork[j].scale = "-ms-transform: scale(1.12)-webkit-transform: scale(1.12);transform: scale(1.12)";
                } else {
                    thisWork[j].scale = "";
                }
            }
            array[i].thisClassWork = thisWork;
        }
        Session.set("noclass",false);
        Session.set("calendarclasses", Meteor.user().profile.classes);
        return array;
    }
});

Template.registerHelper('pref', (val) => {
    if(Object.keys(Meteor.user().profile.preferences).length !== Object.keys(defaults).length) {
        var array = Meteor.user().profile;
        array.preferences = defaults;
        Session.set("serverData",array);
        sendData("editProfile");
        if(val === 'timeHide' || val === 'done') return defaults[val];
        return defaults[val].charAt(0).toUpperCase() + defaults[val].slice(1);
    } else {
        var preferences = Meteor.user().profile.preferences;
        if(val === 'timeHide' || val === 'done') {
            var invert = _.invert(ref);
            return invert[preferences[val]];
        }
        return preferences[val].charAt(0).toUpperCase() + preferences[val].slice(1);
    }
});

Template.main.helpers({
    schoolName() {
        return " - " + Meteor.user().profile.school;
    },
    iconColor(icon) {
        if (Session.get("sidebar") === icon + "Container") {
            return Session.get("themeColors")[Meteor.user().profile.preferences.theme].statusIcons;
        } else if (Session.get("sidebar") === "both") {
            return Session.get("themeColors")[Meteor.user().profile.preferences.theme].statusIcons;
        } else {
            return;
        }
    },
    defaultMode() {
        if(load) {
            Session.set("mode",Meteor.user().profile.preferences.mode);
            load = false; 
        }
        return;
    },
    bgSrc() {
        var dim = [window.innerWidth, window.innerHeight];
        var pic = "Backgrounds/"+Session.get("themeColors")[Meteor.user().profile.preferences.theme].background;
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
            return Session.get("themeColors")[Meteor.user().profile.preferences.theme].highlightText;
        } else {
            return;
        }
    },
    currMode(name) {
        var mode = Session.get("mode");
        if (name === mode) {
            return true;
        } else {
            return false;
        }
    },
    calendarOptions() {
        return {
            id: "fullcalendar",
            height: window.innerHeight * 0.8,
            buttonText: {
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day'
            },
            events: function(start, end, timezone, callback) {
                var events = [];
                var cursor = work.find({class: {$in: Session.get("calendarclasses")}});
                var classDisp = Session.get("classDisp");
                var hide = Meteor.user().profile.preferences.timeHide;
                cursor.forEach(function(current) {
                    var disp = true;
                    if(classDisp.length !== 0 && classDisp.indexOf(current.class) === -1) disp = false;

                    if(hide !== 0) {
                        var due = (moment(current.dueDate))["_d"];
                        var today = (moment().subtract(hide,'days'))["_d"];
                        if(today > due) {
                            disp = false;
                        }   
                    }
                    if(Meteor.user().profile.preferences.done && current.done.indexOf(Meteor.userId()) !== -1) disp = false;

                    var inRole = false;
                    var currClass = classes.findOne({_id: current.class})

                    if(Meteor.userId() === current.creator || 
                    Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                    currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
                    currClass.banned.indexOf(Meteor.userId()) !== -1
                    ) inRole = true;

                    backgroundColor = workColors[current.type];
                    title = current.name;
                    duedate = current.dueDate.toISOString().slice(0, 10);

                    if(disp) {
                        events.push({
                            id: current._id,
                            start: duedate,
                            title: title,
                            backgroundColor: backgroundColor,
                            borderColor: "#444",
                            startEditable: inRole,
                            className: "workevent "+current.class,
                        });
                    }
                });
                callback(events);
            },
            eventDrop: function(event, delta, revertFunc) {
                var current = work.findOne({_id:event.id});
                var date = event.start.format().split("-");
                current.dueDate = new Date(date[0],parseInt(date[1])-1,date[2],11,59,59);
                Session.set("serverData",current);
                sendData("editWork");
            },
            eventClick: function(event, jsEvent, view) {
                Session.set("newWork",false);
                var thisWork = work.findOne({_id:event.id})
                Session.set("currentWork",thisWork);
                var thisReadWork = formReadable(thisWork);
                Session.set("currentReadableWork",thisReadWork);
                openDivFade(document.getElementsByClassName("overlay")[0]);
            },
            dayClick: function(date, jsEvent, view) {
                if(jsEvent.target.className.includes("fc-other-month") || jsEvent.target.className.includes("fc-past")) return;
                Session.set("calCreWork",true);
                Session.set("calWorkDate",date.format());
                Session.set("sidebar","menuContainer");              
            }
        };
    },
    calCenter() {
        var width = window.innerWidth * 0.85;
        return "width:" + width.toString() + "px;margin-left:" + (0.5 * window.innerWidth - 0.5 * width).toString() + "px;";
    },
    calColor() {
        return "color:"+Session.get("themeColors")[Meteor.user().profile.preferences.theme].calendar;
    },
    calbg() {
        var width = window.innerWidth * 0.865;
        var height = window.innerHeight * 0.76;
        return "width:" + width.toString() + "px;height:" + height.toString() + "px;margin-left:" + (0.5 * window.innerWidth - 0.5 * width).toString() + "px;margin-top:" + (0.47 * window.innerHeight - 0.5 * height).toString() + "px";
    },
    calCreWork() {
        if(Session.get("calCreWork")) {
            var div = document.getElementById("calCreWork");
            div.style.setProperty("display","inline-block","important");
            div.style.setProperty("opacity","0","important");
            setTimeout(function() {
                div.style.setProperty("opacity","1","important");
            }, 100);
            return;
        } else {
            try {
                closeDivFade(document.getElementById("calCreWork"));
            } catch(err) {}
            return;
        }
    },
    highlight() {
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
    workCenter() {
        var w = window.innerWidth * 0.3;
        var h = window.innerHeight * 0.7;
        return "width:"+w.toString()+"px;height:"+h.toString()+"px;margin-left:"+-0.5*w.toString()+"px;margin-top:"+-0.5*h.toString()+"px";
    },
    commentDim() {
        var work = Session.get("currentWork");
        if(Session.get("newWork") === null || work === null) return;
        if(Session.get("newWork") || work.comments.length <= 3) return;
        return 0.23*window.innerHeight.toString() + "px";
    },
    work(value) {
        if(Session.get("currentWork") === null) return;
        return Session.get("currentReadableWork")[value];
    },
    workType() {
        if(Session.get("currentWork") === null) return;
        if(Session.get("currentWork").type === undefined) return;
        type = Session.get("currentWork").type;
        if(type.includes("edit")) {
            return;
        } else {
            return workColors[type];
        }
    },
    commentLength() {
        return Session.get("commentRestrict");
    },
    newWork() {
        return Session.get("newWork");
    },
    inRole() {
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
        var sessval = Session.get("modifying");

        if (event.target.id !== sessval &&
            event.target.id !== sessval + "a" &&
            !Session.equals("modifying", null) &&
            !event.target.parentNode.className.includes("workOptions") &&
            !event.target.parentNode.className.includes("prefOptions")) {
            closeInput(sessval);
        }

        if (e !== Session.get("sidebar") &&
        !e.includes("fa-cog") &&
        !e.includes("fa-bars") &&
        !document.getElementById("menuContainer").contains(event.target) &&
        !document.getElementById("optionsContainer").contains(event.target) &&
        !(event.target.className.includes("fc-today") ||
        (event.target.className.includes("fc-future") && !event.target.className.includes("fc-other-month")))) {
            if(Session.get("calCreWork")) {
                Session.set("calCreWork",false);
            }
            Session.set("sidebar",null);
        }

        if(e === "overlay") {
            closeDivFade(document.getElementsByClassName("overlay")[0]);
            if(!Session.get("newWork")) {
                if(getHomeworkFormData() === null) return;
                Session.set("serverData",Session.get("currentWork"));
                sendData("editWork");
                document.getElementById("workComment").value = "";
            }
            Session.set("newWork",null);
            Session.set("currentWork",null);
            Session.set("currentReadableWork",null);
            $('.req').css("color","")
            Session.set("commentRestrict",null);

        }

        if (!event.target.className.includes("radio") &&
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
    'click .creWork' (event) {
        if(event.target.className !== "creWork") {
            var attr = event.target.parentNode.getAttribute("classid");
        } else {
            var attr = event.target.getAttribute("classid");
        }
        Session.set("newWork", true);
        Session.set("currentReadableWork",
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
    'click .change' (event) {
        if(!Session.get("newWork") && !document.getElementById("optionsContainer").contains(event.target)) {
            var currClass = classes.findOne({_id: Session.get("currentWork")["class"]});
            if(!(Meteor.userId() === Session.get("currentWork").creator || 
            Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
            currClass.banned.indexOf(Meteor.userId()) !== -1
            )) return;   
        }

        var ele = event.target;
        var sessval = Session.get("modifying");
        if (ele.id !== sessval && sessval !== null) closeInput(sessval);

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
        input.setAttribute("opc", ele.getAttribute("opc"));
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
    'click .radio' (event) {
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
            for (var i = 0; i < document.getElementsByClassName(radio).length; i++) {
                var curr = document.getElementsByClassName(radio)[i];
                if(curr.childNodes[1] !== op.parentNode.parentNode.childNodes[3].childNodes[1]) {
                    closeDivFade(document.getElementsByClassName(radio)[i]);
                }
            }
        } catch (err) {}
        openDivFade(op.parentNode.parentNode.childNodes[3]);
    },
    'click .workOptionText' (event) {
        var sessval = Session.get("modifying");
        var p = event.target;
        var input = p.parentNode.parentNode.childNodes[1].childNodes[5];
        input.value = p.childNodes[0].nodeValue;
        try {
            closeInput(sessval);
        } catch (err) {}

        closeDivFade(p.parentNode);
        input.focus();
    },
    'click .prefOptionText' (event) {
        var sessval = Session.get("modifying");
        var p = event.target;
        var input = p.parentNode.parentNode.childNodes[1].childNodes[5];
        input.value = p.childNodes[0].nodeValue;
        try {
            closeInput(sessval);
        } catch (err) {}

        closeDivFade(p.parentNode);
        input.focus();
    },
    'keydown' (event) {
        var sessval = Session.get("modifying");
        if (event.keyCode == 13 && sessval != "workDesc") {
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
    'click #commentSubmit' (event) {
        workId = Session.get("currentWork")._id;
        var input = document.getElementById('workComment');
        comment = input.value;
        input.value = "";
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
    'click #workSubmit' () {
        if(getHomeworkFormData() === null) return;
        Session.set("serverData",Session.get("currentWork"));
        if(Session.get("newWork")) {
            sendData("createWork");
        } else {
            sendData("editWork");
        }
        Session.set("newWork",null);
        closeDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'focus .op' (event) {
        event.target.click();
    },
    'click .workCard' (event) {
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
            if(!(Meteor.userId() === Session.get("currentWork").creator || 
            Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
            currClass.banned.indexOf(Meteor.userId()) !== -1)) {
                var inputs = $('#editWork .change').css("cursor","default");
            };   
        }

        openDivFade(document.getElementsByClassName("overlay")[0]);
    },
    'focus #workDatea' () {
        $('#workDatea').datepicker({
            format: 'DD, MM d, yyyy',
            startDate: 'd',
            todayHighlight: true,
            todayBtn: true,
            autoclose: true
        });
    },
    'click .sideClass' (event) {
        var div = event.target;
        while(div.getAttribute("classid") === null) div = div.parentNode;
        var classid = div.getAttribute("classid");

        if(Session.get("calCreWork")) {
            Session.set("calCreWork",null);
            Session.set("sidebar",null);

            var date = Session.get("calWorkDate").split("-");
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
        } else {
            var array = Session.get("classDisp");
            if(array.indexOf(classid) !== -1) {
                array.splice(array.indexOf(classid),1);
            } else {
                array.push(classid);
            }    
            Session.set("classDisp",array);
            $("#fullcalendar").fullCalendar( 'refetchEvents' );
        }
    },
    'mouseover .sideClass' (event) {
        if(event.target.className !== "sideClass") {
            var div = event.target.parentNode;
        } else {
            var div = event.target;  
        }
        while(div.getAttribute("classid") === null) div = div.parentNode;
        var classid = div.getAttribute("classid");
        Session.set("classDispHover",classid);
    },
    'mouseleave .sideClass' (event) {
        if(event.target.className !== "sideClass") {
            var div = event.target.parentNode;
            if(div.contains(event.target)) return;
        }
        Session.set("classDispHover",null);
    },
    'keydown #workComment' (event) {
        var chars = event.target.value.length;
        document.getElementById("commentRestrict").style.color = "#CCC";
        if(chars === 200) {
            document.getElementById("commentRestrict").style.color = "#FF1A1A";
        }
        Session.set("commentRestrict", "Characters left: " + (200-chars).toString()); 
    }, 
    'click #markDone' () {
        Session.set("serverData", [Session.get("currentWork")._id, "done"])
        sendData("toggleWork");
    },
    'click #markConfirm' () {
        Session.set("serverData", [Session.get("currentWork")._id, "confirmations"])
        sendData("toggleWork");
    },
    'click #markReport' () {
        Session.set("serverData", [Session.get("currentWork")._id, "reports"])
        sendData("toggleWork");
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
    Meteor.call(funcName, Session.get("serverData") , function(err,result) {
        if((funcName === "editWork" || funcName === "createWork") && Session.get("mode") === "calendar") {
            $("#fullcalendar").fullCalendar( 'refetchEvents' );
        } else if(funcName === "toggleWork") {
            var workId = Session.get("currentWork")._id;
            var thisWork = work.findOne({_id:workId});
            Session.set("currentWork",thisWork);
            var thisReadWork = formReadable(thisWork);
            Session.set("currentReadableWork",thisReadWork);
        } else if(funcName === "editProfile") {
            $("#fullcalendar").fullCalendar( 'refetchEvents' );
        }
    });   
}

function closeInput(sessval) {
    var input = document.getElementById(sessval + "a");
    var span = document.getElementById(sessval);
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
    if (input.value === "") {
        span.childNodes[0].nodeValue = "Click here to edit...";
    } else {
        span.childNodes[0].nodeValue = input.value;
    }
    span.style.display = "initial";
    Session.set("modifying", null);

    if(Session.equals("sidebar","optionsContainer") || Session.equals("sidebar","both")) {
        Session.set("serverData",getPreferencesData());
        sendData("editProfile");
    } else if(!Session.get("newWork")) {
        if(getHomeworkFormData() === null) return;
        Session.set("serverData",Session.get("currentWork"));
        sendData("editWork");
    }
}

function getHomeworkFormData() {
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

function getPreferencesData() {
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

function getReadableDate(date) {
    return days[date.getDay()]+", "+months[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
}

function toDate(date) {
    date = date.substring(date.search(",")+2,date.length);
    month = months.indexOf(date.substring(0,date.search(" ")));
    day = date.substring(date.search(" ")+1,date.search(","));
    year = date.substring(date.search(",")+2,date.length);
    return new Date(year,month,day,11,59,59);
}

function formReadable(input) {
    input.dueDate = getReadableDate(input.dueDate);
    input.type = input.type[0].toUpperCase() + input.type.slice(1);

    if(!Session.get("newWork")) {
        if(input.done.indexOf(Meteor.userId()) !== -1) {
            input.doneCol = "#27A127";
            input.doneText = "Done!";
        } else {
            input.doneCol = "";
            input.doneText = "Mark done";
        }

        for(var i = 0; i < input.done.length; i++) {
            input.done[i] = {"user":Meteor.users.findOne({_id:input.done[i]}).profile.name};
        }

        if(input.confirmations.indexOf(Meteor.userId()) !== -1) {
            input.userConfirm = "#27A127";
        } else {
            input.userConfirm = "";
        }

        if(input.reports.indexOf(Meteor.userId()) !== -1) {
            input.userReport = "#FF1A1A";
        } else {
            input.userReport = "";
        }

        input.confirmations = input.confirmations.length;
        input.reports = input.reports.length;

        var comments = input.comments;
        var resort = [];
        if(!Session.get("newWork")) {
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
