/* jshint esversion: 6 */
import {
    Template
} from 'meteor/templating';


Session.set("sections", [0,0]) // [Completed, Viewing] 
Session.set("profile", {});
Session.set("notsearching", true); // If user isn't searching
Session.set("noclass", null); // If user doesn't have classes.
Session.set("notfound", null); // If no results for autocomplete.

Template.profile.helpers({
    schoolgradenext() {
        if(_.contains([null, undefined, ""], Meteor.user().profile.school ||
                      _.contains([null, undefined, ""], Meteor.user().profile.grade))) {
            return "";
        } else {
            return "disabled";
        }
    },
    showArrow(type) {
        var order = [
            {"back":false, "forward":true},
            {"back":true, "forward":true},
            {"back":true, "forward":false}
        ];
        var section = Session.get("sections");
        if(type === "forward") {
            return (section[1]+1 <= section[0] && order[section[1]][type]) ? "block":"none";
        } else {
            return (order[section[1]][type]) ? "block":"none";
        }
    },
    classes() {
         var array = classes.find({
            status: {
                $eq: true
            },
            privacy: {
                $eq: false
            },
            school: {
                $eq: Session.get("profile").school
            }
        }, {
            sort: {
                subscribers: -1
            }
        }, {
            limit: 20
        }).fetch();

        for (var i = 0; i < array.length; i++) {
            array[i].join = true;
            array[i].subscribers = array[i].subscribers.length;
            array[i].teachershort = array[i].teacher.split(" ").slice(1).reduce(function(a, b) {
                return a + " " + b;
            });
        }
        if (array.length === 0) {
            Session.set("noclass", true);
        } else {
            Session.set("noclass", false);
        }
        return array;
    },
    classSettings() {
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
    }
});

Template.profile.events({
    'click' (event) { // Closes respective divs when clicking outside of them. Order matters.
        var e = event.target.className;

        if(modifyingInput !== null && event.target !== document.getElementById(modifyingInput)) {
            if (!(e.includes("optionHolder") || e.includes("optionText"))) {
                toggleOptionMenu(false, modifyingInput);
                modifyingInput = null;
            }
        }
    },
    'click #basicNext' () {
        var inputs = document.getElementsByClassName("basicInfoField");
        var required = ["school", "grade"];
        var alert = checkComplete(required, inputs);
        var values = alert[2];
        if(!alert[0]) {
            sAlert.error("Missing " + alert[1], {
                effect: 'stackslide',
                position: 'top',
                timeout: 3000
            });
            return;
        } 
        var profile = Session.get("profile");
        profile.school = values["school"];
        profile.grade = values["grade"];
        Session.set("profile", profile);
        Session.set("sections", [(Session.get("sections")[0] < 1) ? 1 : Session.get("sections")[0], Session.get("sections")[1]])
        slideToField(1);
    },
    'click #backArrow' () {
        slideToField(Session.get("sections")[1]-1);
    },
    'click #forwardArrow' () {
        slideToField(Session.get("sections")[1]+1);
    },
    // HANDLING INPUT CHANGING
    'focus .clickModify' (event) {
        $(".optionHolder")
        .fadeOut(100);

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
        document.getElementById(modifyingInput).value = option;
        toggleOptionMenu(false, modifyingInput);
        $(".selectedOption").removeClass("selectedOption");
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
                return b.subscribers - a.subscribers;
            }));
        } catch (err) {}
    },
});

function slideToField(field) {
    var order = ["basicInfo", "enrollInfo"];
    $(".moveArrow").animate({"opacity":0})
    var viewing = Session.get("sections")[1]
    var move = (viewing-field < 0) ? "-50%" : "150%";
    $("#"+order[viewing]).animate({top: move});
    $("#"+order[field]).animate({
        top:"20%"
    },{
        complete: function() {
            Session.set("sections", [Session.get("sections")[0],field]);
            $(".moveArrow").animate({"opacity":1});
        }
    });
}
