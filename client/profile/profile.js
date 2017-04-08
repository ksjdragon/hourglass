/* jshint esversion: 6 */
import {
    Template
} from 'meteor/templating';

Session.set("sections", [0,0]) // [Completed, Viewing] 
Session.set("profile", {classes: []});
Session.set("newClasses", []);
Session.set("autocompleteDivs", null);
Session.set("notsearching", true); // If user isn't searching
Session.set("noclass", null); // If user doesn't have classes.
Session.set("notfound", null); // If no results for autocomplete.

Template.profile.helpers({
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
            _id: {
                $nin: Session.get("profile").classes
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
    enrollClass() {
        var myClasses = Session.get("profile").classes;
        var newClasses = Session.get("newClasses");
        if((myClasses === undefined || myClasses.length === 0) && newClasses.length === 0) return [{name:"Enroll!",x:false}];
        var array = myClasses.map(function(a) {
            return {name:classes.findOne({_id:a}).name,x:true,_id:a}
        });
        array.push.apply(array,newClasses.map(function(a){
            return {name:a.name,_id:(Math.floor(Math.random()*1000)).toString(),x:true};
        }));
        return array;
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
        Session.set("sections", [(Session.get("sections")[0] < 1) ? 1 : Session.get("sections")[0], Session.get("sections")[1]]);
        slideToField(1);
        $("#profileSubmit").fadeIn(200);
    },
    'click #createActivate' () {
        Session.set("sections", [(Session.get("sections")[0] < 2) ? 2 : Session.get("sections")[0], Session.get("sections")[1]]);
        slideToField(2);
    },
    'click #creSubmit' () {
        var inputs = document.getElementsByClassName("creInput");
        var required = ["school", "name", "privacy", "category"];
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
        values.privacy = (values.privacy === "Public") ? false : true;
        values.status = false;
        values.category.toLowerCase();
        values.code = "";
        var newClasses = Session.get("newClasses");
        var duplicate = false;
        for(var i = 0; i < newClasses.length; i++) {
            if(JSON.stringify(newClasses[i]) === JSON.stringify(values)) duplicate = true;
        }
        if(!duplicate && newClasses.length < 8) newClasses.push(values);
        if(duplicate) sAlert.error("You already created this class!", {
            effect: 'stackslide',
            position: 'bottom-right',
            timeout: 3000
        });
        if(newClasses.length === 8) sAlert.error("You already created 8 classes!", {
            effect: 'stackslide',
            position: 'bottom-right',
            timeout: 3000
        });
        Session.set("newClasses", newClasses);
        $(".creInput").each(function(){$(this).val('');});
        
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
        if(option !== Session.get("profile").school) {
            newSetting = Session.get("profile");
            newSetting["classes"] = [];
            newSetting.school = option;
            Session.set("profile", newSetting);
        }
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
                    if(Session.get("profile").classes.indexOf(id) !== -1) continue;
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
    'click .classBox .fa-plus, click #classBody .classBox' (event) {
        var profile = Session.get("profile");
        while(event.target.getAttribute("classid") === null) event.target = event.target.parentNode;
        var id = event.target.getAttribute("classid");
        if(profile.classes.indexOf(id) === -1) {
            profile.classes.push(id);
            Session.set("profile", profile);
            if(Session.get("autocompleteDivs") === null) return;
            var divs = Session.get("autocompleteDivs");
            divs.splice(divs.map(function(a) {
                return a._id; 
            }).indexOf(id),1);
            Session.set("autocompleteDivs", divs);
        }
    },
    'click #ESCWrapper .fa-times' (event) {
        var profile = Session.get("profile");
        var id = event.target.parentNode.getAttribute("classid");
        if(id.length < 17) {
            var newClasses = Session.get("newClasses");
            newClasses.splice(newClasses.map(function(a) {
                return a._id;
            }).indexOf(id),1);
            Session.set("newClasses", newClasses);
            return;
        }
        if(profile.classes.indexOf(id) !== -1) {
            profile.classes.splice(profile.classes.indexOf(id),1);
            Session.set("profile", profile);
            if(Session.get("autocompleteDivs") === null) return;
            var divs = Session.get("autocompleteDivs");
            var myClass = classes.findOne({_id: id});
            myClass.subscribers = myClass.subscribers.length;
            myClass.teachershort = myClass.teacher.split(" ")[1]
            myClass.join = true;
            divs.push(myClass);
            Session.set("autocompleteDivs", divs.sort(function(a, b) {
                return b.subscribers - a.subscribers;
            }));
        }
    },
    'click #profileSubmit' () {
        // clear html and make page uninteractable
        var myClasses = Session.get("profile").classes;
        var newClasses = Session.get("newClasses");
        var message = "Sorry, your profile couldn't be created. Please try again!";

        if(myClasses.length === 0 && newClasses.length === 0) {
            sAlert.error("Please enroll in a class!", {
                effect: 'stackslide',
                position: 'top'
            });
            return;
        }

        _.each(myClasses, function(myClass) {
            Meteor.call("joinClass", [myClass, ""], function(err, result) {
                if(err !== undefined) {
                    sAlert.error(message, {
                        effect: 'stackslide',
                        position: 'top'
                    });
                }
            })  
        });
        _.each(newClasses, function(newClass) {
            if (!teachers.findOne({
                name: newClass.teacher
            })) {
                Meteor.call("createTeacher", newClass.teacher, newClass.school, function(error, result) {
                    if (error !== undefined) {
                        sAlert.error(message, {
                            effect: 'stackslide',
                            position: 'top'
                        });
                    } else {
                        Meteor.call("createClass", newClass, function(error, result) {
                            if(error !== undefined) {
                                sAlert.error(message, {
                                    effect: 'stackslide',
                                    position: 'top'
                                });    
                            }
                        });
                    }
                });
            } else {
                Meteor.call("createClass", newClass, function(error, result) {
                    if(error !== undefined) {
                        sAlert.error(message, {
                            effect: 'stackslide',
                            position: 'top'
                        });    
                    }
                });
            }
        });
        var profile = Session.get("profile");
        profile.complete = true;
        profile.preferences = Meteor.user().profile.preferences;
        profile.classes.push(Meteor.userId());
        Meteor.call("editProfile", profile, function(err, result) {
            if(err !== undefined) {
                sAlert.error(message, {
                    effect: 'stackslide',
                    position: 'top'
                });
            }
            Meteor.subscribe('classes');
            Meteor.subscribe('schools');
            Meteor.subscribe('teachers');
            Meteor.subscribe('work');
            Meteor.subscribe('requests');
            Meteor.subscribe("personalUser");
            Meteor.subscribe('users');
        });  
    }
});

function slideToField(field) {
    var order = ["basicInfo", "enrollInfo", "createInfo"];
    $(".moveArrow").animate({"opacity":0})
    if(field === 0) $("#enrollClassList").fadeOut(200);
    var viewing = Session.get("sections")[1]
    var move = (viewing-field < 0) ? "-100%" : "150%";
    $("#"+order[viewing]).animate({top: move});
    $("#"+order[field]).animate({
        top:"17%"
    },{
        complete: function() {
            Session.set("sections", [Session.get("sections")[0],field]);
            $(".moveArrow").animate({"opacity":1});
            if(field === 1) $("#enrollClassList").fadeIn(200);
        }
    });
}
