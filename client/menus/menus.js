var filterOpen =  [false,true,true];
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

Template.sidebarOptionPlate.events({

});
