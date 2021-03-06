/* jshint esversion: 6 */
Session.set("settingMode", "manageClass");
Session.set("classInfoMode", "general");
Session.set("notsearching", true); // If user isn't searching
Session.set("noclass", null); // If user doesn't have classes.
Session.set("notfound", null); // If no results for autocomplete.

var filterOpen = [true, true, true, true, true];
var sidebarMode = [null, null];

Template.sidebarMenuPlate.rendered = function() {
    $(".menuWrapper").velocity("slideDown", 150);
    $("#classListHolder").slimScroll({
        width: '100%',
        height: '',
        touchScrollStep: 90
    });
    $("#filterWrapper.slimScrollBar").css("display", "none");
};
Template.sidebarOptionPlate.rendered = function() {
    $(".menuWrapper").velocity("slideDown", 150);
};
Template.sidebarRequestPlate.rendered = function() {
    $(".menuWrapper").velocity("slideDown", 150);
};
Template.sidebarCreatePlate.rendered = function() {
    $(".menuWrapper").velocity("slideDown", 150);
};

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
    }
});

Template.sidebarMenuPlate.events({
    'click .classes' () { // Click classes mode button.
        if (Session.equals("mode", "classes")) return;
        toggleToMode("classes");
        setTimeout(startDragula, 500);
        toggleToSidebar(false);
    },
    'click .calendar' () { // Click calendar mode button.
        if (Session.equals("mode", "calendar")) return;
        toggleToMode("calendar");
        toggleToSidebar(false);
    },
    'click #filterHead' (event) {
        if (event.target.id === "disableFilter") return;
        if (!filterOpen[0]) {
            $("#filterWrapper").velocity("slideDown", 150);
        } else {
            $("#filterWrapper").velocity("slideUp", 150);
        }
        filterOpen[0] = !filterOpen[0];
    },
    'click #typeFilterWrapper' () {
        if (!filterOpen[1]) {
            $("#classFilterHolder").velocity("slideDown", 150);
            $("#classListHolder").velocity({'max-height':'27.4507vh'},300);
        } else {
            $("#classFilterHolder").velocity("slideUp", 150);
            $("#classListHolder").velocity({'max-height':'52vh'},300);
        }
        filterOpen[1] = !filterOpen[1];
    },
    'click #classFilterWrapper' () {
        if (!filterOpen[2]) {
            var height = (88-100*$("#classFilterWrapper").offset().top / window.innerHeight) + "vh";
            $("#classListHolder").css('max-height',height);
            $("#classListHolder").velocity("slideDown", 150);
        } else {
            $("#classListHolder").velocity("slideUp", 150);
        }
        filterOpen[2] = !filterOpen[2];
    },
    // CLASS FILTERS
    'click .sideClass' (event) { // Click class list in sidebar.
        var classid = event.target.getAttribute("classid");
        var array = Session.get("classDisp");
        if (array.indexOf(classid) !== -1) {
            array.splice(array.indexOf(classid), 1);
        } else {
            array.push(classid);
        }
        Session.set("classDisp", array);
        filterWork();
    },
    'click .sideFilter' (event) {
        var type = event.target.getAttribute("type");
        var array = Session.get("typeFilter");
        if (array.indexOf(type) !== -1) {
            array.splice(array.indexOf(type), 1);
        } else {
            array.push(type);
        }
        Session.set("typeFilter", array);
        filterWork();
    },
    'click #disableFilter' () {
        Session.set("classDisp", []);
        Session.set("typeFilter", []);
        filterWork();
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
        if (Session.get("demo")) {
            sAlert.error("Not available in demo!", {
                effect: 'stackslide',
                position: 'top',
                timeout: 2000
            });
            return;
        }
        toggleToMode("addClass");
    },
    'click .createClass' () { // Click classes mode button.
        if (Session.equals("settingMode", "createClass")) return;
        if (Session.get("demo")) {
            sAlert.error("Not available in demo!", {
                effect: 'stackslide',
                position: 'top',
                timeout: 2000
            });
            return;
        }
        toggleToMode("createClass");
    },
    'click #settingMode' () {
        if (!filterOpen[3]) {
            $("#settingModeWrapper").velocity("slideDown", 150);
        } else {
            $("#settingModeWrapper").velocity("slideUp", 150);
        }
        filterOpen[3] = !filterOpen[3];
    },
    'click #preferencesWrapper' () {
        if (!filterOpen[4]) {
            $("#prefCont").velocity("slideDown", 150);
        } else {
            $("#prefCont").velocity("slideUp", 150);
        }
        filterOpen[4] = !filterOpen[4];
    }
});

Template.sidebarCreatePlate.events({
    'click .sideClass' (event) { // Click class list in sidebar.
        var classid = event.target.getAttribute("classid");
        var newSetting = Session.get("currentWork");
        newSetting.class = classid;
        Session.set("newWork", true);
        Session.set("currentWork", newSetting);
        $(".overlay").velocity("fadeIn", 150);
    }
});

Template.registerHelper("classInfo", (info) => {
    if(Session.get("demo")) {
        if(Session.equals("classInfo", "Personal")) var isYou = true;
        var thisClass = Session.get("myClasses").filter(function(obj) {
            return obj.name === Session.get("classInfo");
        })[0];
    } else {
        var thisClass = classes.findOne({
            _id: Session.get("classInfo")
        });
        if (thisClass === undefined) return;
        var isYou = Session.equals("classInfo", Meteor.userId());
    }
    switch (info) {
        case "name":
            return (isYou) ? "Personal" : thisClass.name;
        case "teacher":
            return (isYou) ? "None" : thisClass.teacher;
        case "hour":
            return (isYou) ? "None" : thisClass.hour;
        case "category":
            return (isYou) ? "Personal" : thisClass.category[0].toUpperCase() + thisClass.category.slice(1);
        case "privacy":
            return (isYou) ? true : thisClass.privacy;
        case "admin":
            if(Session.get("demo")) return "A. Robot";
            return Meteor.users.findOne({
                _id: (isYou) ? Meteor.userId() : thisClass.admin
            });
        case "code":
            if(isYou || Meteor.userId() !== thisClass.admin) return false;
            var exist;
            Meteor.call('getCode', thisClass._id, function(err, result) {
                Session.set("code", [(result === undefined || result === "") ? false : true, result]);
            });
            break;
        case "mine":
            return (isYou) ? true : Meteor.userId() === thisClass.admin;
        case "moderators":
            if (isYou || thisClass.moderators.length === 0) return [];
            var moderators = [];
            thisClass.moderators.forEach(function(ele) {
                var array = Meteor.users.findOne({
                    _id: ele
                });
                array.delete = true;
                moderators.push(array);
            });
            return moderators;
        case "banned":
            if (isYou || thisClass.banned.length === 0) return [];
            var banned = [];
            thisClass.banned.forEach(function(ele) {
                var array = Meteor.users.findOne({
                    _id: ele
                });
                array.delete = true;
                banned.push(array);
            });
            return banned;
        case "subscribers":
            if (isYou || thisClass.subscribers.length === 0) return [];
            var subscribers = [];
            thisClass.subscribers.forEach(function(ele) {
                subscribers.push(Meteor.users.findOne({
                    _id: ele
                }));
            });
            return subscribers;
        case "personal":
            return isYou;
    }
});

Template.registerHelper("classInfoMode", (mode, check) => {
    if (typeof check === "string") return Session.equals("classInfoMode", mode);
    return (Session.equals("classInfoMode", mode)) ? Session.get("user").preferences.theme.modeHighlight + ";background-color:rgba(0,0,0,0.1);" : "rgba(0,0,0,0)";
});

Template.registerHelper("classSelected", () => {
    return !Session.equals("classInfo", null);
});

Template.manageClass.rendered = function() {
    $("#classBody").slimScroll({
        width: '100%',
        height: '',
        touchScrollStep: 60,
        color: '#FFF',
        railOpacity: 0.7
    });
}

Template.manageClass.events({
    'click .classBox' (event) {
        var classId = event.target.getAttribute("classid");
        if (Session.equals("classInfo", classId)) return;
        toggleToClassInfo(classId);
    },
    'click #classInfoModeWrapper span:first-child' () {
        if (Session.equals("classInfoMode", "general")) return;
        toggleToClassInfoMode("general");
    },
    'click #classInfoModeWrapper span:last-child' () {
        if (Session.equals("classInfoMode", "users")) return;
        if (Session.get("demo")) {
            sAlert.error("Not available in demo!", {
                effect: 'stackslide',
                position: 'top',
                timeout: 2000
            });
            return;
        }
        toggleToClassInfoMode("users");
    },
    'click .infoCard .fa-pencil-square-o' () {
        $("#changeAdminWrapper").velocity("fadeIn", 150);
    },
    'click #adminSubmit' () {
        var input = document.getElementById("changeAdmin");
        var value = input.value;
        var classid = Session.get("classInfo");
        var user = Meteor.users.findOne({
            "services.google.email": value
        });
        if (!user) {
            sAlert.error("Invalid email!", {
                effect: 'stackslide',
                position: 'top',
                timeout: 3000
            });
            return;
        }
        serverData = [
            user._id,
            classid
        ];
        Session.set("confirmText", "Change ownership?");
        confirm = "changeAdmin";
        $("#confirmOverlay").velocity("fadeIn", 150);
    },
    'click #deleteClass' () {
        serverData = Session.get("classInfo");
        confirm = "deleteClass";
        Session.set("confirmText", "Delete this class?");
        $("#confirmOverlay").velocity("fadeIn", 150);
    },
    'click .classBox .fa-times' (event) {
        serverData = event.target.parentNode.getAttribute("classid");
        confirm = "leaveClass";
        Session.set("confirmText", "Leave this class?");
        $("#confirmOverlay").velocity("fadeIn", 150);
    }
});

Template.joinClass.rendered = function() {
    $("#classBody").slimScroll({
        width: '100%',
        height: '',
        touchScrollStep: 60,
        color: '#FFF',
        railOpacity: 0.7
    });
}

Template.joinClass.helpers({
    classes() { // Loads all of the possible classes ( Limit of twenty shown ) ( Sorts by class size ) ( Only your school)
        var array = classes.find({
            status: {
                $eq: true
            },
            privacy: {
                $eq: false
            },
            _id: {
                $nin: Session.get("user").classes
            },
            school: {
                $eq: Session.get("user").school
            }
        }, {
            sort: {
                subscribers: -1
            }
        }, {
            limit: 100
        }).fetch();

        for (var i = 0; i < array.length; i++) {
            array[i].join = true;
            array[i].subscribers = array[i].subscribers.length;
            array[i].teachershort = (array[i].teacher === undefined) ? "" : array[i].teacher.split(" ").slice(1);
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
                template: Template.classAutoList,
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
    }
});

Template.joinClass.events({
    'click .classBox' (event) {
        var classId = event.target.getAttribute("classid");
        if (Session.equals("classInfo", classId)) return;
        toggleToClassInfo(classId);
    },
    'click #classInfoModeWrapper span:first-child' () {
        if (Session.equals("classInfoMode", "general")) return;
        toggleToClassInfoMode("general");
    },
    'click #classInfoModeWrapper span:last-child' () {
        if (Session.equals("classInfoMode", "users")) return;
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
            var items = document.getElementsByClassName("-autocomplete-container")[0].children;  
            if(items[0].tagName === "I") {
                Session.set("notfound", true);
                return;
            } else {
                items = items[0].children;
                for(var i = 0; i < items.length; i++) {
                    var item = items[i].children;
                    var id = item[4].textContent;
                    if(Session.get("user").classes.indexOf(id) !== -1) continue;
                    divs.push({
                        name: item[0].textContent,
                        teachershort: item[1].textContent.split(" ")[1],
                        hour: item[2].textContent,
                        subscribers: (item[3].textContent.match(new RegExp(",","g")) || []).length+1,
                        _id: id,
                        join: true
                    })
                }
                Session.set("autocompleteDivs", divs.sort(function(a, b) {
                    return b.subscribers - a.subscribers;
                }));
                Session.set("notfound", false);
                return;
            }
        } catch(err) {}
    },
    'click .classBox .fa-plus' (event) {
        serverData = [event.target.parentNode.getAttribute("classid"), ""];
        confirm = "joinClass";
        Session.set("confirmText", "Join this class?");
        $("#confirmOverlay").velocity("fadeIn", 150);
    },
    'click #private' () {
        $("#privateCode").css('display', 'inline-block');
        var input = document.getElementById("privateCode");
        input.focus();
        if (input.value === "") return;
        Meteor.call("joinPrivateClass", input.value, function(error, result) {
            if (result) {
                sAlert.success("Joined!", {
                    effect: 'stackslide',
                    position: 'bottom-right',
                    timeout: 1500
                });
                $("#privateCode").velocity("fadeOut",100);
            } else {
                sAlert.error("Invalid code!", {
                    effect: 'stackslide',
                    position: 'top',
                    timeout: 1500
                });
            }
            Meteor.subscribe("classes");
        });

    }
});

Template.createClass.helpers({
    schoolComplete() { // Returns autocomplete array for schools.
        return {
            position: "bottom",
            limit: 6,
            rules: [{
                token: '',
                collection: schools,
                field: 'name',
                matchAll: true,
                template: Template.schoolList
            }]
        };
    },
    teacherComplete() { // Returns autocomplete array for teachers.
        return {
            position: "bottom",
            limit: 1,
            rules: [{
                token: '',
                collection: teachers,
                field: 'name',
                template: Template.teacherList
            }]
        };
    }
});

Template.createClass.events({
    'click #creSubmit' () {
        var inputs = document.getElementsByClassName("creInput");
        var required = ["school", "name", "privacy", "category"];
        var alert = checkComplete(required, inputs);
        var values = alert[2];
        if (!alert[0]) { // Check missing fields.
            sAlert.error("Missing " + alert[1], {
                effect: 'stackslide',
                position: 'top',
                timeout: 3000
            });
            return;
        }
        values.privacy = (values.privacy === "Public") ? false : true;
        values.status = false; 
        values.category = values.category.toLowerCase();
        values.code = "";
        serverData = values;

        if(values.teacher !== "" && values.teacher.split(" ").length < 2) {
            sAlert.error("Please enter the full name of the teacher! Ex: Darrin Woods", {
                effect: 'stackslide',
                position: 'bottom-right',
                timeout: 3000
            });
            return;
        }

        if (!teachers.findOne({
                name: values.teacher
            }) && values.teacher !== "") {
            Meteor.call("createTeacher", values.teacher, values.school, function(error, result) {
                if (error !== undefined) {
                    sAlert.error(error.message, {
                        effect: 'stackslide',
                        position: 'top'
                    });
                } else {
                    sendData("createClass");
                }
            });
        } else {
            sendData("createClass");
        }
    }
});

Template.classInfoCode.events({
    'click .fa' (event) {
        document.getElementById("copyHolder").select();
        document.execCommand("copy");
        $(event.target.parentNode.childNodes[9]).fadeIn(100, function() {
            setTimeout(function() {
                $(event.target.parentNode.childNodes[9]).velocity("fadeOut", 150);
            }, 500);
        });
    }
});

Template.classInfoCode.helpers({
    code(info) {
        try {
            if(info === "exists") {
                return Session.get("code")[0];
            } else {
                return Session.get("code")[1];
            }
        } catch(err) {}
    }
})

Template.classInfoUsers.events({
    'click .userAdder .fa' (event) {
        var type = event.target.getAttribute("user");
        var input = event.target.parentNode.childNodes[4];
        var value = input.value;
        var classid = Session.get("classInfo");
        var user = Meteor.users.findOne({
            "services.google.email": value
        });
        if (!user) {
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
        var outerInput = event.target.parentNode.parentNode.parentNode.parentNode.childNodes[1];
        var type = outerInput.childNodes[6].getAttribute("user");
        var userid = event.target.parentNode.parentNode.getAttribute("userid");
        if (!Meteor.users.findOne({
                _id: userid
            })) {
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

toggleToMode = function(mode) {
    $("#mainBody").fadeOut(150, function() {
        (Session.equals("sidebarMode", "option")) ? Session.set("settingMode", mode): Session.set("mode", mode);
        Session.set("classInfo", null);
        $("#mainBody").fadeIn(150);
    });
};

toggleToSidebar = function(sidebar) {
    try {
        $("#backgroundOverlay").velocity("fadeOut", 200);
    } catch (err) {}
    if (Session.equals("sidebarMode", sidebar) || !sidebar) {
        $("#menuContainer").hide("slide", {
            direction: "left"
        }, 200);
        $("#divCenter").stop().velocity({
            left: '6vh'
        }, 200, function() {
            Session.set("sidebarMode", "");
        });
    } else {
        $("#menuContainer").show("slide", {
            direction: "left"
        }, 200);
        $("#divCenter").stop().velocity({
            left: '36vh'
        }, 200);
        $(".menuWrapper").fadeOut(200, function() {
            Session.set("sidebarMode", sidebar);
        });
    }
    filterOpen = [true, true, true, true, true];
};

toggleToClassInfo = function(classId) {
    $("#changeAdminWrapper").velocity("fadeOut", 150);
    $("#infoClassCont").velocity("fadeOut", 150, function() {
        Session.set("classInfo", classId);
        Session.set("classInfoMode", "general");
        $(this).velocity("fadeIn", 150);
    });
};

toggleToClassInfoMode = function(mode) {
    $("#infoClassCont").velocity("fadeOut", 150, function() {
        Session.set("classInfoMode", mode);
        $(this).velocity("fadeIn",150);
    });
};
