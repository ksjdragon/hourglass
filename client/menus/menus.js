Session.set("settingMode", "manageClass");
Session.set("classInfoMode", "general");

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
    },
    filterOn() {
        return Session.get("classDisp").length !== 0 || Session.get("typeFilter").length !== 0;
    },
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
    },
    // CLASS FILTERS
    'click .sideClass' (event) { // Click class list in sidebar.
        var div = event.target;
        while (div.getAttribute("classid") === null) div = div.parentNode;
        var classid = div.getAttribute("classid");

        if (Session.equals("sidebarMode","create")) { // If creating work from calendar.
            var newSetting = Session.get("currentWork");
            newSetting.class = classid;
            Session.set("currentWork", newSetting);
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
        Session.set("typeFilter", []);
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

Template.registerHelper("classInfo", (info) => {
    var thisClass = classes.findOne({_id:Session.get("classInfo")});
    var isYou = Session.equals("classInfo", Meteor.userId());
    switch (info) {
        case "name":
            return (isYou) ? "Personal" : thisClass.name;
        case "teacher":
            return (isYou) ? "None": thisClass.teacher;
        case "hour":
            return (isYou) ? "None" : thisClass.hour;
        case "category":
            return (isYou) ? "Personal" :  thisClass.category[0].toUpperCase() + thisClass.category.slice(1);
        case "privacy":
            return (isYou) ? true : thisClass.privacy;
        case "admin":
            return Meteor.users.findOne({_id: (isYou) ? Meteor.userId() : thisClass.admin});
        case "code":
            return (isYou || !thisClass.code) ? {exists: false} : {exists: true, code: thisClass.code};
        case "mine":
            return (isYou) ? true : Meteor.userId() === thisClass.admin;
        case "moderators":
            if (isYou || thisClass.moderators.length === 0) return [];
            var moderators = [];
            thisClass.moderators.forEach(function(ele) {
                var array = Meteor.users.findOne({_id: ele});
                array.delete = true;
                moderators.push(array);
            });
            return moderators;
        case "banned":
            if (isYou || thisClass.banned.length === 0) return [];
            var banned = [];
            thisClass.banned.forEach(function(ele) {
                var array = Meteor.users.findOne({_id: ele});
                array.delete = true;
                banned.push(array);
            });
            return banned;
        case "subscribers":
            if (isYou || thisClass.subscribers.length === 0) return [];
            var subscribers = [];
            thisClass.subscribers.forEach(function(ele) {
                subscribers.push(Meteor.users.findOne({_id: ele}));
            });
            return subscribers;
        case "personal":
            return isYou;
    }
});

Template.registerHelper("classInfoMode", (mode, check) => {
    if(typeof check === "string") return Session.equals("classInfoMode",mode);
    return (Session.equals("classInfoMode", mode)) ? Session.get("user").preferences.theme.modeHighlight + ";background-color:rgba(0,0,0,0.1);" : "rgba(0,0,0,0)";
})

Template.manageClass.events({
    'click .classBox' (event) {
        var classId = event.target.getAttribute("classid");
        if(Session.equals("classInfo",classId)) return;
        toggleToClassInfo(classId); 
    },
    'click #classInfoModeWrapper span:first-child' () {
        if(Session.equals("classInfoMode","general")) return;
        toggleToClassInfoMode("general");
    },
    'click #classInfoModeWrapper span:last-child' () {
        if(Session.equals("classInfoMode","users")) return;
        toggleToClassInfoMode("users");
    }
});

Template.joinClass.helpers({
     classes() { // Loads all of the possible classes ( Limit of twenty shown ) ( Sorts by class size ) ( Only your school)
        var array = classes.find({
            status: {$eq: true},
            privacy: {$eq: false},
            _id: {$nin: Session.get("user").classes},
            school: {$eq: Session.get("user").school}
        }, 
        {sort: {subscribers: -1}}, 
        {limit: 20}
        ).fetch();

        for (var i = 0; i < array.length; i++) {
            array[i].subscribers = array[i].subscribers.length;
        }
        if (array.length === 0) {
            Session.set("noclass", true);
        } else {
            Session.set("noclass", false);
        }
        return array;
    },
    classSettings() { // Returns autocomplete array for classes.
        return {
            position: "bottom",
            limit: 10,
            rules: [{
                token: '',
                collection: classes,
                template: Template.classDisplay,
                filter: {
                    privacy: false,
                    status: true
                },
                selector: (match) => {
                    regex = new RegExp(match, 'i');
                    return {
                        $or: [{
                            'name': regex
                        }, {
                            'teacher': regex
                        }, {
                            'hour': regex
                        }]
                    };
                }
            }]
        };
    },
    notsearching() { // Tells whether user is using the searchbox
        return Session.get("notsearching");
    },
    autocompleteClasses() { // Returns current auto-completes for classes
        return Session.get("autocompleteDivs");
    },
    notfound() { // Returns if autocomplete has no results.
        return Session.get("notfound");
    },
});

Template.joinClass.events({
    'click .classBox' (event) {
        var classId = event.target.getAttribute("classid");
        if(Session.equals("classInfo",classId)) return;
        toggleToClassInfo(classId); 
    },
    'click #classInfoModeWrapper span:first-child' () {
        if(Session.equals("classInfoMode","general")) return;
        toggleToClassInfoMode("general");
    },
    'click #classInfoModeWrapper span:last-child' () {
        if(Session.equals("classInfoMode","users")) return;
        toggleToClassInfoMode("users");
    },
    'input #classSearch' (event) { // Auto-complete updater
        if (event.target.value.length === 0) {
            Session.set("notsearching", true);
        } else {
            Session.set("notsearching", false);
        }
        Session.set("autocompleteDivs", null);
        var divs = [];
        try {
            var items = document.getElementsByClassName("-autocomplete-container")[0].childNodes[3].childNodes;
            if (items.length === 0) { // If no results.
                Session.set("notfound", true);
            } else {
                Session.set("notfound", false);
            }
            for (var i = 2; i < items.length; i += 3) { // Iterate through autocomplete div.
                var item = items[i].childNodes[3];
                if (Meteor.user().profile.classes.indexOf(item.getAttribute("classid")) !== -1) continue;
                divs.push({
                    name: item.childNodes[1].childNodes[0].nodeValue,
                    teacher: item.childNodes[3].childNodes[0].nodeValue,
                    hour: item.childNodes[5].childNodes[0].nodeValue,
                    subscribers: Math.floor(item.childNodes[7].childNodes[0].nodeValue.replace(",", "").length / 17),
                    _id: item.getAttribute("classid")
                });
            }
            Session.set("autocompleteDivs", divs.sort(function(a, b) {
                return b.subscribers - a.subscribers
            }));
        } catch (err) {}
    }
});

Template.classInfoUsers.events({
    'click .userAdder .fa' (event) {
        var type = event.target.getAttribute("user");
        var input = event.target.parentNode.childNodes[4];
        var value = input.value;
        var classid = Session.get("classInfo");
        var user = Meteor.users.findOne({
            "services.google.email": value
        });
        if(!user)  {
            sAlert.error("Invalid email!", {
                effect: 'stackslide',
                position: 'top',
                timeout: 3000
            });
            return;
        }
        serverData = [
            user._id,
            classid,
            type,
            true
        ];
        sendData("trackUserInClass");
        input.value = "";
    },
    'click .userDisp .fa' (event) {
        var outerInput = event.target.parentNode.parentNode.parentNode.parentNode.childNodes[1]
        var type = outerInput.childNodes[6].getAttribute("user");
        var userid = event.target.parentNode.parentNode.getAttribute("userid");
        if(!Meteor.users.findOne({_id: userid})) {
            sAlert.error("Stop hacking, reload the page.", {
                effect: 'stackslide',
                position: 'top',
                timeout: 3000
            });
            return;
        }
        var classid = Session.get("classInfo");
        serverData = [
            userid,
            classid,
            type,
            false
        ];
        sendData("trackUserInClass");
    }
});

Template.classInfoCode.events({
    'click .fa' (event) {
        document.getElementById("copyHolder").select();
        document.execCommand("copy");
        $(event.target.parentNode.childNodes[9]).fadeIn(100, function() {
            setTimeout(function() {
                $(event.target.parentNode.childNodes[9]).fadeOut(250);
            }, 500);
        });
    }
});

toggleToMode = function(mode) {
    $("#mainBody").fadeOut(250, function() {
        (Session.equals("sidebarMode", "option")) ? Session.set("settingMode", mode) : Session.set("mode",mode);
        $("#mainBody").fadeIn(250);
    });
}

toggleToSidebar = function(sidebar) {
    try {
        $("#backgroundOverlay").fadeOut(250);
    } catch(err) {}
    if(Session.equals("sidebarMode", sidebar) || !sidebar) {
        $("#menuContainer").hide("slide",  {direction: "left"}, 250);
        $("#divCenter").stop().animate({left: '6vh'}, 250, function() {
            Session.set("sidebarMode", "");
        });
    } else {
        $("#menuContainer").show("slide",  {direction: "left"}, 250);
        $("#divCenter").stop().animate({left: '36vh'}, 250);
        $(".menuWrapper").fadeOut(200, function() {
            Session.set("sidebarMode", sidebar);
        });
    }
}

toggleToClassInfo = function(classId) {
    $("#infoClassCont").fadeOut(250, function() {
        Session.set("classInfo", classId);
        Session.set("classInfoMode", "general");
        $(this).fadeIn(250);
    });
}

toggleToClassInfoMode = function(mode) {
    $("#infoClassCont").fadeOut(250, function() {
        Session.set("classInfoMode", mode);
        $(this).fadeIn(250);
    });   
}
