Session.set("settingMode", "manageClass");

var filterOpen =  [false, true, true, true, true];
var sidebarMode = [null,null];

Template.sidebarMenuPlate.rendered = function(){$(".menuWrapper").slideDown(300);}
Template.sidebarOptionPlate.rendered = function(){$(".menuWrapper").slideDown(300);}
Template.sidebarRequestPlate.rendered = function(){$(".menuWrapper").slideDown(300);}
Template.sidebarCreatePlate.rendered = function(){$(".menuWrapper").slideDown(300);}

Template.sidebarMenuPlate.helpers({
    modeStatus(status) { // Color status of display modes.
        return (Session.equals("mode", status)) ? Session.get("user").preferences.theme.modeHighlight : "rgba(0,0,0,0)";
    },
    types() {
        var types = Object.keys(workColors);
        var array = [];
        for (var i = 0; i < types.length; i++) {
            array.push({
                "type": types[i],
                "typeName": types[i][0].toUpperCase() + types[i].slice(1),
                "selected": (_.contains(Session.get("typeFilter"), types[i])) ? Session.get("user").preferences.theme.modeHighlight : "rgba(0,0,0,0)"
            });
        }
        return array;
    }
});

Template.sidebarMenuPlate.events({
    'click .classes' () { // Click classes mode button.
        if (Session.equals("mode", "classes")) return;
        toggleToMode("classes")
        setTimeout(startDragula, 500);
        toggleToSidebar(false);
    },
    'click .calendar' () { // Click calendar mode button.
         if (Session.equals("mode", "calendar")) return;
        toggleToMode("calendar");
        toggleToSidebar(false);
    },
    'click #filterHead' (event) {
        if(event.target.id === "disableFilter") return;
        if(!filterOpen[0]) {
            $("#filterWrapper").slideDown(300);
        } else {
            $("#filterWrapper").slideUp(300);
        }
        filterOpen[0] = !filterOpen[0];
    },
    'click #typeFilterWrapper' () {
        if(!filterOpen[1]) {
            $("#classFilterHolder").slideDown(300);
        } else {
            $("#classFilterHolder").slideUp(300);
        }
        filterOpen[1] = !filterOpen[1];
    },
    'click #classFilterWrapper' () {
        if(!filterOpen[2]) {
            $("#classListHolder").slideDown(300);
        } else {
            $("#classListHolder").slideUp(300);
        }
        filterOpen[2] = !filterOpen[2];
    }
});

Template.sidebarOptionPlate.helpers({
    modeStatus(status) { // Color status of display modes.
        return (Session.equals("settingMode", status)) ? Session.get("user").preferences.theme.modeHighlight : "rgba(0,0,0,0)";
    },
});

Template.sidebarOptionPlate.events({
    'click .manageClass' () { // Click classes mode button.
        if (Session.equals("settingMode", "manageClass")) return;
        toggleToMode("manageClass");
    },
    'click .addClass' () { // Click classes mode button.
        if (Session.equals("settingMode", "addClass")) return;
        toggleToMode("addClass");
    },
    'click .createClass' () { // Click classes mode button.
        if (Session.equals("settingMode", "createClass")) return;
        toggleToMode("createClass");
    },
    'click #settingMode' () {
        if(!filterOpen[3]) {
            $("#settingModeWrapper").slideDown(300);
        } else {
            $("#settingModeWrapper").slideUp(300);
        }
        filterOpen[3] = !filterOpen[3];
    },
    'click #preferencesWrapper' () {
        if(!filterOpen[4]) {
            $("#prefCont").slideDown(300);
        } else {
            $("#prefCont").slideUp(300);
        }
        filterOpen[4] = !filterOpen[4];
    }
});

function toggleToMode(mode) {
    $("#mainBody").fadeOut(250, function() {
        (Session.equals("sidebarMode", "option")) ? Session.set("settingMode", mode) : Session.set("mode",mode);
        $("#mainBody").fadeIn(250);
    });
}
