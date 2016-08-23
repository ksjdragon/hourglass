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
        "cards": "#050505",
        "classes":"#46396E",
        "calendar": "#000",
        //30313B
        "text": "#F6F6F6" 
    }
};

var workColors = {
    "normal": "#2E4F74",
    "quiz": "#409333",
    "test": "#AD3C44",
    "project": "#E6E619",
    "other": "#852E6D"
};

var defaults = {
    "theme":"light",
    "mode":"classes"
    //"timeHide":7
}

// Reactive variables.
Session.set("calendarclasses", null);
Session.set("sidebar", null);
Session.set("newWork",null);
Session.set("currentWork",null);
Session.set("currentReadableWork",null);
Session.set("modifying",null);
Session.set("radioDiv",null);
Session.set("radioOffset",null);
Session.set("serverData",null);
Session.set("noclass",null);
Session.set("creCalWork",null);
Session.set("calWorkDate",null);

Template.registerHelper('divColor', (div) => {
    return themeColors[Meteor.user().profile.preferences.theme][div];
});

Template.registerHelper("textColor", () => {
    document.getElementsByTagName("html")[0].style.color = themeColors[Meteor.user().profile.preferences.theme].text;
    return; 
});

Template.registerHelper('overlayDim', (part) => {
    var dim = [window.innerWidth * 0.2, window.innerHeight * 0.25];
    var width = "width:" + dim[0].toString() + "px;";
    var height = "height:" + dim[1].toString() + "px;";
    var margin = "margin-left:" + (-dim[0] / 2).toString() + "px;";
    var bg = "background-color:" + themeColors[Cookie.get("theme")].header + ";";
    return width + height + margin + bg;
});

Template.registerHelper('myClasses', () => {
    if (Meteor.user().profile.classes === undefined || Meteor.user().profile.classes.length === 0) {
        Session.set("noclass",true);
        return [];
    } else {
        var array = [];
        var courses = Meteor.user().profile.classes;
        for(var i = 0; i < courses.length; i++) {
            found = classes.findOne({_id:courses[i]});
            found.subscribers = found.subscribers.length/17;

            if(found.admin === Meteor.userId()) found.box = " owned";
            found.mine = true;
            array.push(found);

            var thisWork = work.find({class: courses[i]}).fetch();

            for(var j = 0; j < thisWork.length; j++) {
                thisWork[j].dueDate = moment(thisWork[j].dueDate).calendar(null, {
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    nextWeek: 'dddd',
                    lastDay: '[Yesterday]',
                    lastWeek: '[Last] dddd',
                    sameElse: 'MMMM Do'
                });
                thisWork[j].typeColor = workColors[thisWork[j].type];
            }
            array[i].thisClassWork = thisWork;
        }
        Session.set("noclass",false);
        Session.set("calendarclasses", Meteor.user().profile.classes);
        var hide = Meteor.user().profile.preferences.timeHide;
        return array;
    }
});

Template.main.helpers({
    schoolName() {
        return " - " + Meteor.user().profile.school;
    },
    iconColor(icon) {
        if (Session.get("sidebar") === icon + "Container") {
            return themeColors[Meteor.user().profile.preferences.theme].statusIcons;
        } else if (Session.get("sidebar") === "both") {
            return themeColors[Meteor.user().profile.preferences.theme].statusIcons;
        } else {
            return;
        }
    },
    defaultMode() {
        Session.set("mode",Meteor.user().profile.preferences.mode);
        return;
    },
    bgSrc() {
        var dim = [window.innerWidth, window.innerHeight];
        var pic = "Backgrounds/"+themeColors[Meteor.user().profile.preferences.theme].background;
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
                cursor.forEach(function(current) {
                    var inRole = false;
                    if(Meteor.userId() === current.creator || 
                    Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                    classes.findOne({_id: current._id}).moderators.indexOf(Meteor.userId()) !== -1||
                    classes.findOne({_id: current._id}).blockEdit.indexOf(Meteor.userId()) !== -1 ||
                    classes.findOne({_id: current._id}).banned.indexOf(Meteor.userId()) !== -1
                    ) inRole = true;
                    backgroundColor = workColors[current.type];
                    title = current.name;
                    duedate = current.dueDate.toISOString().slice(0, 10);
                    events.push({
                        id: current._id,
                        start: duedate,
                        title: title,
                        backgroundColor: backgroundColor,
                        borderColor: "#444",
                        startEditable: inRole,
                        className: "workevent",
                    });
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
        return "color:"+themeColors[Meteor.user().profile.preferences.theme].calendar;
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
    workCenter() {
        var w = window.innerWidth * 0.3;
        var h = window.innerHeight * 0.7;
        return "width:"+w.toString()+"px;height:"+h.toString()+"px;margin-left:"+-0.5*w.toString()+"px;margin-top:"+-0.5*h.toString()+"px";
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
    newWork() {
        return Session.get("newWork");
    },
    inRole() {
        if(Session.get("newWork")) {
            return true;
        } else {
            if(Meteor.userId() === Session.get("currentWork").creator || 
               Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
               classes.findOne({_id: Session.get("currentWork")._id}).moderators.indexOf(Meteor.userId()) !== -1||
               classes.findOne({_id: Session.get("currentWork")._id}).blockEdit.indexOf(Meteor.userId()) !== -1 ||
               classes.findOne({_id: Session.get("currentWork")._id}).banned.indexOf(Meteor.userId()) !== -1
              ) return true;
        }
    },
    pref(val) {
        if(Meteor.user().profile.preferences === null) {
            var array = Meteor.user().profile;
            array.preferences = defaults;
            Session.set("serverData",array);
            sendData("editProfile");
            return defaults[val].charAt(0).toUpperCase() + defaults[val].slice(1);
        } else {
            var preferences = Meteor.user().profile.preferences;
            return preferences[val].charAt(0).toUpperCase() + preferences[val].slice(1);
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
            }
            Session.set("newWork",null);
        }

        if (event.target.id !== sessval &&
            event.target.id !== sessval + "a" &&
            !Session.equals("modifying", null) &&
            !event.target.parentNode.className.includes("workOptions") &&
            !event.target.parentNode.className.includes("prefOptions")) {
            closeInput(sessval);
        }

        if (!event.target.className.includes("radio") &&
            !Session.equals("radioDiv", null) &&
            !event.target.parentNode.className.includes("workOptions") &&
            !event.target.parentNode.className.includes("prefOptions") &&
            event.target.readOnly !== true) {
            if(Session.equals("sidebar","optionsContainer") || Session.equals("sidebar","both")) {
                var radio = "prefOptions";
            } else {
                var radio = "workOptions";
            }
            var opnum = parseInt(Session.get("radioDiv")) - parseInt(Session.get("radioOffset"));
            for (var i = 0; i < document.getElementsByClassName(radio).length; i++) {
                try {
                    closeDivFade(document.getElementsByClassName(radio)[i]);
                } catch (err) {}
            }
            Session.set("radioDiv", null);
            Session.set("radioOffset", null);
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
            if(!(Meteor.userId() === Session.get("currentWork").creator || 
            Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            classes.findOne({_id: Session.get("currentWork")._id}).moderators.indexOf(Meteor.userId()) !== -1 ||
            classes.findOne({_id: Session.get("currentWork")._id}).blockEdit.indexOf(Meteor.userId()) !== -1 ||
            classes.findOne({_id: Session.get("currentWork")._id}).banned.indexOf(Meteor.userId()) !== -1
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
        var op = event.target;
        Session.set("radioDiv", op.getAttribute("op"));
        Session.set("radioOffset", op.getAttribute("opc"));
        if(Session.equals("sidebar","optionsContainer") || Session.equals("sidebar","both")) {
            var radio = "prefOptions";
        } else {
            var radio = "workOptions";
        }
        try {
            for (var i = 0; i < document.getElementsByClassName(radio).length; i++) {
                var curr = document.getElementsByClassName(radio)[i];
                if (Session.get("radioDiv") !== i.toString()) {
                    closeDivFade(document.getElementsByClassName(radio)[i]);
                }
            }
        } catch (err) {}
        openDivFade(document.getElementsByClassName(radio)[op.getAttribute("op")]);
    },
    'click .workOptions p' (event) {
        var sessval = Session.get("modifying");
        var p = event.target;
        var opnum = parseInt(Session.get("radioDiv")) - parseInt(Session.get("radioOffset"));
        var input = document.getElementsByClassName("op")[opnum];
        input.value = p.childNodes[0].nodeValue;
        try {
            closeInput(sessval);
        } catch (err) {}

        closeDivFade(p.parentNode);
        input.focus();
        Session.set("radioDiv", null);
        Session.set("radioOffset", null);
    },
    'click .prefOptions p' (event) {
        var sessval = Session.get("modifying");
        var p = event.target;
        var opnum = parseInt(Session.get("radioDiv")) - parseInt(Session.get("radioOffset"));
        var input = document.getElementsByClassName("op")[opnum];
        input.value = p.childNodes[0].nodeValue;
        try {
            closeInput(sessval);
        } catch (err) {}

        closeDivFade(p.parentNode);
        input.focus();
        Session.set("radioDiv", null);
        Session.set("radioOffset", null);
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
        comment = document.getElementById('workComment').value;
        if (comment !== "") {
            document.getElementById('workComment').value = "";
            Meteor.call('addComment', [comment, workId]);
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
        if(!Session.equals("mode","calendar")) return;
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

function sendData(funcName) {
    Meteor.call(funcName, Session.get("serverData") , function(err,result) {
        if((funcName === "editWork" || funcName === "createWork") && Session.get("mode") === "calendar") {
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
    var desc = document.getElementById("workDesc");
    if(desc.childNodes[0].nodeValue.includes("Click here to edit")) {
        desc.childNodes[0].nodeValue = "Missing field";
        desc.style.color = "#FF1A1A";
        stop = true;
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
        "mode":document.getElementById("prefMode").childNodes[0].nodeValue.toLowerCase()
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
    return input;
}
