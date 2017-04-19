Session.set("profile", {classes: []});
Session.set("notsearching", true); // If user isn't searching
Session.set("noclass", null); // If user doesn't have classes.
Session.set("autocompleteDivs", null);

Template.mProfile.rendered = function() {
	addMobileButton($("#school"), 0.2, "brightness", function() {
		Session.set("mProfOption", "school");
		$("#mOpOverlay").velocity("fadeIn", 200);
	});

	addMobileButton($("#grade"), 0.2, "brightness", function() {
		Session.set("mProfOption", "grade");
		$("#mOpOverlay").velocity("fadeIn", 200);
	});

	addMobileButton($("#classCont"), -0.1, "brightness", function() {
		if(Session.get("profile").school === undefined) return;
		Session.set("mProfOption", "class");
		$("#mOpOverlay").velocity("fadeIn", 200);
	});

	addMobileButton($("#mProfSubmit"), -0.1, "brightness", function() {
		var myClasses = Session.get("profile").classes;
        var message = "Sorry, your profile couldn't be created. Please try again!";

        var inputs = document.getElementsByClassName("mSelect");
        var required = ["school","grade"];
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

        if(myClasses.length === 0) {
            sAlert.error("Please enroll in a class!", {
                effect: 'stackslide',
                position: 'top'
            });
            return;
        }

        joinClass(0);
        
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
	});
}

Template.mProfile.helpers({
	mProfOp(type) {
		return Session.equals("mProfOption", type);
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
    notsearching() { // Tells whether user is using the searchbox
        return Session.get("notsearching");
    },
    autocompleteClasses() { // Returns current auto-completes for classes
        return Session.get("autocompleteDivs");
    },
    notfound() { // Returns if autocomplete has no results.
        return Session.get("notfound");
    },
    mProfClasses() {
    	var array = [];
    	var myClasses = Session.get("profile").classes;
    	for(var i = 0; i < myClasses.length; i++) {
    		var val = classes.findOne({_id: myClasses[i]});
    		val.subscribers = val.subscribers.length;
            val.teachershort = val.teacher.split(" ").slice(1).reduce(function(a, b) {
                return a + " " + b;
            });
    		array.push(val);
    		
    	}
    	return array;
    }
});

Template.mProfile.events({
	'click #mOpOverlay' (event) {
		if(event.target.id === "mOpOverlay") {
			$("#mOpOverlay").velocity("fadeOut", 200);
		}
	},
	'input #mClassSearch' (event) { // Auto-complete updater
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
})

Template.mOptionCard2.rendered = function() {
	var div = this.firstNode;
	addMobileButton(div, 0.1, "brightness", function() {
		$("#"+Session.get("mProfOption"))[0].value = div.innerHTML;
			var newSetting = Session.get("profile");
			if(Session.equals("mProfOption", "school")) {
				$("#classCont").removeClass("mDisable");
				if(div.innerHTML !== Session.get("profile").school) {
					newSetting["classes"] = [];
				}
				newSetting[Session.get("mProfOption")] = div.innerHTML;
			} else {
				newSetting[Session.get("mProfOption")] = div.innerHTML;
			}
			Session.set("profile", newSetting);
			$("#mOpOverlay").velocity("fadeOut", 200);
			
	});
}

Template.mClassDisplay.rendered = function() {
	var div = this.firstNode;
	addMobileButton(div, 0.1, "brightness", function() {
		var newSetting = Session.get("profile");
		newSetting.classes.push(div.getAttribute("classid"));
		Session.set("profile", newSetting);
		$("#mOpOverlay").velocity("fadeOut", 200);
	});
}

Template.mClassDisplay2.rendered = function() {
	let div = this.firstNode.children[3];
    addMobileButton(div, 0.1, "brightness", function() {
        console.log(div);
       var newSetting = Session.get("profile");
        newSetting.classes.splice(newSetting.classes.indexOf(div.parentNode.getAttribute("classid")),1)
        Session.set("profile", newSetting); 
    });
}

function joinClass(num) {
    var joining = Session.get("profile").classes;
    Meteor.call("joinClass", [joining[num], ""], function(err, result) {
        if(err !== undefined) {
            sAlert.error(err.message, {
                effect: 'stackslide',
                position: 'top'
            });
        }
        joined++;
        if(joined !== joining.length) {
            joinClass(joined);
        }
    });
}