Session.set("mobileMode", "main");
Session.set("classDisp", []);
Session.set("typeFilter", []);
Session.set("restrictText", {});
Session.set("select", "none");
Session.set("options", null);

var filterOpen = [false, true, true];
var timeout;

Template.registerHelper('optionInfo', (type) => {
	var op = Session.get("options")
	if(type === "title") return op[1];
	if(type === "list") {
		return options[op[0]];
	}
});

Template.mobile.created = function() {
	Session.set("myWork", []);
	Session.set("filterWork", []);
	getClasses(Session.get("user").classes);
	work.find().observeChanges({
        added: function (id, fields) {
            updateWork(id, fields, "added");
            filterWork();
        },
        changed: function (id, fields) {
            updateWork(id, fields, "changed");
            filterWork();
        },
        removed: function (id) {
            updateWork(id, null, "remove");
        }
    });
}

Template.mobile.rendered = function() {
	document.getElementsByTagName("body")[0].style.color = Session.get("user").preferences.theme.textColor;
	// Buttons
	addMobileButton($("#mainCircleButton")[0], 50, "color", function() {
		if(Session.equals("mobileMode","main") || Session.equals("mobileMode","done")) {
			Session.set("currentWork", null);
			Session.set("select", "class");
			toggleSidebar(true);
    	} else if(Session.equals("mobileMode","addWork") || Session.equals("mobileMode", "editWork")) {
    		var inputs = document.getElementsByClassName("mAddForm");
	        var required = ["name", "dueDate", "class"];
	        var alert = checkComplete(required, inputs);
	        var values = alert[2];
	        if(!alert[0]) {
	            sAlert.error("Missing " + alert[1].replace("dueDate", "due date"), {
	                effect: 'stackslide',
	                position: 'top',
	                timeout: 3000
	            });
	            return;
	        }
	        values["class"] = Session.get("currentWork")["class"];
	        values.type = Session.get("currentWork").type;
	        values.dueDate = toDate(values["dueDate"]);

	        if(Session.equals("mobileMode","addWork")) {
	        	serverData = values;
	        	sendData("createWork");
	        } else {
	        	values._id = Session.get("currentWork")._id;
	        	serverData = values;
	        	sendData("editWork");
	        }
	        
			$("#mainCircleButton").velocity("fadeOut", 200);
	        $("#mobileBody").velocity("fadeOut", {
				duration: 200,
				complete: function() {
					Session.set("mobileMode", "main");
			        $("#mobileBody").velocity("fadeIn", 200);
					$("#mainCircleButton").velocity("fadeIn", 200);
					timedPushback(true);
				}
			});
    	}
	});

	addMobileButton($("#mSidebarToggle")[0], 0.2, "brightness", function() {
		if(Session.equals("mobileMode","main") || Session.equals("mobileMode","done")) {
			toggleSidebar(true);
		} else {
			$("#mainCircleButton").velocity("fadeOut", 200);
			$("#mobileBody").velocity("fadeOut", {
				duration: 200,
				complete: function() {
					$("#mainCircleButton").velocity("fadeIn", 200);
			        $("#mobileBody").velocity("fadeIn", 200);
			        Session.set("mobileMode", "main");
    				timedPushback(false);	
				}
			});
    	}
	});	

	// FOR SIDEBAR SLIDEBACK
	var deltaX = 0;
	var sidebar = $("#mSidebar");
	new Hammer(sidebar[0], {
		domEvents: true
	});

	sidebar.on('panmove', function(e) {
		var dX = deltaX + (e.originalEvent.gesture.deltaX);
		if(dX > 0) {
			$.Velocity.hook(sidebar, 'translateX', dX/70 + 'px');
		} else {
			$.Velocity.hook(sidebar, 'translateX', dX + 'px');
		}
	});

	sidebar.on('panend', function(e) {
		deltaX += (e.originalEvent.gesture.deltaX);
		if(deltaX >= -window.innerWidth * 0.4) {
			deltaX = 0;
			sidebar.velocity({'translateX': "0px"}, 150);
		} else {
			deltaX = 0;
			toggleSidebar(false);

		}
	});
	timedPushback(true);
}

Template.mobile.events({
	'click #mOverlay' () {
		if(timeout) toggleSidebar(false);
	}
});

Template.defaultSidebar.rendered = function() {
	addMobileButton($(".mSectionMode")[0], 0.2, "brightness", function() {
		if(Session.equals("mobileMode", "main")) {
			toggleSidebar(false);
		} else {
			Session.set("mobileMode","main");
			toggleSidebar(false);
			timedPushback(true);
		}
	});

	addMobileButton($(".mSectionMode")[1], 0.2, "brightness", function() {
		if(Session.equals("mobileMode", "done")) {
			toggleSidebar(false);
		} else {
			Session.set("mobileMode","done");
			toggleSidebar(false);
			timedPushback(true);
		}
	});

	addMobileButton($("#mSettings"), 0.1, "brightness" , function() {
		toggleSidebar(false);
		$("#mainCircleButton").velocity("fadeOut", 200);
		$("#mobileBody").velocity("fadeOut", {
			duration: 200,
			complete: function() {
		        Session.set("mobileMode", "settings");
		        $("#mobileBody").velocity("fadeIn", 200);
			}
		});
	});

	addMobileButton($("#mSignOut"), 0.1, "brightness", function() {
		$(".noScroll").velocity("fadeOut", 50);
        document.getElementById('login-buttons-logout').click();
	})

	addMobileButton($("#mFilterHead")[0], 0.1, "brightness", function() {
		if(event.target.id === "mDisableFilter") return;
        if (!filterOpen[0]) {
            $("#mFilterWrapper").slideDown(300);
        } else {
            $("#mFilterWrapper").slideUp(300);
        }
        filterOpen[0] = !filterOpen[0];
	});

	addMobileButton($("#mTypeFilterWrapper")[0], 0.1, "brightness", function() {
		if (!filterOpen[1]) {
            $("#mClassFilterHolder").slideDown(300);
        } else {
            $("#mClassFilterHolder").slideUp(300);
        }
        filterOpen[1] = !filterOpen[1];
	});

	addMobileButton($("#mClassFilterWrapper")[0], 0.1, "brightness", function() {
		if (!filterOpen[2]) {
            $("#mClassListHolder").slideDown(300);
        } else {
            $("#mClassListHolder").slideUp(300);
        }
        filterOpen[2] = !filterOpen[2];
	});

	addMobileButton($("#mDisableFilter")[0], -0.1, "brightness", function() {
        Session.set("typeFilter", []);
		Session.set("classDisp", []);
        timedPushback(true);
	});
}

Template.defaultSidebar.helpers({
	modeStatus(mode) {
		return (Session.equals("mobileMode", mode)) ? Session.get("user").preferences.theme.modeHighlight : "rgba(0,0,0,0)";
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
        return (Session.get("classDisp").length !== 0 || Session.get("typeFilter").length !== 0) ? "inline-block" : "none";
    }
})

Template.mobileClass.rendered = function() {
	var deltaX = 0;
	var clearTile;
	let movable = jQuery(this.firstNode.children[2]);
	let undo = [jQuery(this.firstNode.children[0]), jQuery(this.firstNode.children[1])]

	new Hammer(movable[0], {
		domEvents: true
	});

	movable.on('panmove', function(e) {
		if(Math.abs(e.originalEvent.gesture.deltaY) >= 10) return;
		var dX = deltaX + (e.originalEvent.gesture.deltaX);
		if(dX < 0) {
			$.Velocity.hook(jQuery(e.target), 'translateX', dX/25 + 'px');
		} else {
			$.Velocity.hook(jQuery(e.target), 'translateX', dX + 'px');
		}
	});

	movable.on('panend', function(e) {
		if(e.target === document.getElementById("mobileBody")) return;
		deltaX += (e.originalEvent.gesture.deltaX);
		var id = this.getAttribute("workid");
		if(deltaX >= window.innerWidth * 0.5) {
			deltaX = 0;
			jQuery(e.target).velocity(
			{
				translateX: window.innerWidth*1.2+"px"
			},
			{
				duration: 150,
				complete: function() {
					undo[0].velocity("fadeIn", {duration: 300});
					undo[1].velocity("fadeIn", {duration: 300});
					var container = $(".mClassContainer[workid="+id+"]");
					clearTile = setTimeout(function() {
						undo[0].velocity("fadeOut", {duration: 100});
						undo[1].velocity("fadeOut", {duration: 100});
						container.velocity(
						{
							height: 0
						},
						{
							duration: 200,
							complete: function() {
								serverData = [container[0].getAttribute("workid"), "done"];
    							sendData("toggleWork");
								container.remove();
							}
						});
					}, 1500);
				}
			});

		} else {
			deltaX = 0;
			jQuery(e.target).velocity({translateX: "0px"},300);
		}
	});

	addMobileButton(undo[1], -0.05, "brightness", function() {
		clearTimeout(clearTile);
		movable.velocity({translateX: "0px"},300);
		undo[0].velocity("fadeOut", {duration: 300});
		undo[1].velocity("fadeOut", {duration: 300});
	});

	addMobileButton(movable, -10, "color", function() {
		Session.set("currentWork", work.findOne({_id: movable[0].getAttribute("workid")}));

		var thisWork = work.findOne({
            _id: Session.get("currentWork")._id
        });
        var inRole = false;
        if (thisWork === undefined) return;
        var currClass = classes.findOne({
            _id: thisWork["class"]
        });
        if (Meteor.userId() === thisWork.creator ||
            Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
            currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
            currClass.banned.indexOf(Meteor.userId()) !== -1
           ) {
        	inRole = true;
        }

   		if(inRole) {
   			$("#mainCircleButton").velocity("fadeOut", 200);
   			$("#mobileBody").velocity("fadeOut", {
				duration: 200,
				complete: function() {
					$("#mainCircleButton").velocity("fadeIn", 200);
			        $("#mobileBody").velocity("fadeIn", 200);
			        Session.set("mobileMode", "editWork");
				}
			});
   		} else {
   			$("#mainCircleButton").velocity("fadeOut", 200);
   			$("#mobileBody").velocity("fadeOut", {
				duration: 200,
				complete: function() {
			        $("#mobileBody").velocity("fadeIn", 200);
			        Session.set("mobileMode", "viewWork");
				}
			});
   		}
	});
}

Template.mobileClass.helpers({
	inRole() { // Checks correct permissions.
        if(Session.equals("currentWork",null)) return;
        try {
            var thisWork = work.findOne({
                _id: Session.get("currentWork")._id
            });
            if (thisWork === undefined) return;
            var currClass = classes.findOne({
                _id: thisWork["class"]
            });
            if (Meteor.userId() === thisWork.creator ||
                Roles.userIsInRole(Meteor.userId(), ['superadmin', 'admin']) ||
                currClass.moderators.indexOf(Meteor.userId()) !== -1 ||
                currClass.banned.indexOf(Meteor.userId()) !== -1
               ) return true;
            
        } catch(err) {}
    }
})

Template.mSidebarClasses.rendered = function() {
	let div = this.firstNode;
	addMobileButton(div, 0.1, "brightness", function() {
       	var classid = div.getAttribute("classid");
       	if(Session.equals("select", "class")) {
       		var curr = Session.get("currentWork") || {};
       		curr["class"] = classid;
       		Session.set("currentWork", curr);
       		toggleSidebar(false);
       		if(!Session.equals("mobileMode", "addWork")) {
       			$("#mobileBody").velocity("fadeOut", {
					duration: 200,
					complete: function() {
						Session.set("mobileMode", "addWork");
				        $("#mobileBody").velocity("fadeIn", 200);
						$("#mainCircleButton").velocity("fadeIn", 200);
					}
				});
       		}
       	} else {
	        var array = Session.get("classDisp");
	        if (array.indexOf(classid) !== -1) {
	            array.splice(array.indexOf(classid), 1);
	        } else {
	            array.push(classid);
	        }
	        Session.set("classDisp", array);
	        timedPushback(true);
	        filterWork();
	    }
	});
}

Template.mSideTypeFilter.rendered = function() {
	let div = this.firstNode;
	addMobileButton(div, 0.1, "brightness", function() {
		var type = div.getAttribute("type");
		if(Session.equals("select", "type")) {
			var curr = Session.get("currentWork") || {};
       		curr["type"] = type;
       		Session.set("currentWork", curr);
       		toggleSidebar(false);
		} else {
			var array = Session.get("typeFilter");
	        if (array.indexOf(type) !== -1) {
	            array.splice(array.indexOf(type), 1);
	        } else {
	            array.push(type);
	        }
	        Session.set("typeFilter", array);
	        timedPushback(true);
	        filterWork();
		}
	});
}

Template.mobile.helpers({
	schoolName() { // Finds the name of the user's school.
		if (Session.get("user").school === undefined || Session.get("user").school === null) return;
		return Session.get("user").school;
	},
	iconStatus() {
		return (Session.get("sidebarMode") === "mobile") ? Session.get("user").preferences.theme.iconHighlight : "";
	},
	myWork(done) {
		return (done === "done") ? 
			Session.get("myWork").filter(function(work) {
				return _.contains(work.done, Meteor.userId());
			}) : 
			Session.get("myWork").filter(function(work) {
				return !_.contains(work.done, Meteor.userId());
			})
	},
	showMode(mode) {
		return Session.equals("mobileMode", mode);
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
    noneText(type) {
		return (type === "main") ? 
		(Session.get("myWork").filter(function(work) {
			return !_.contains(work.done, Meteor.userId());
		}).length === 0) ? "block" : "none"
		: 
		(Session.get("myWork").filter(function(work) {
			return _.contains(work.done, Meteor.userId());
		}).length === 0) ? "block" : "none";
    },
    buttonType() {
    	if(Session.equals("mobileMode","main") || Session.equals("mobileMode","done")) {
    		return "pencil";
    	} else if(Session.equals("mobileMode","addWork")) {
    		return "plus";
    	} else if(Session.equals("mobileMode", "editWork")) {
    		return "floppy-o";
    	}
    },
    buttonTypeHeader() {
    	if(Session.equals("mobileMode","main") || Session.equals("mobileMode","done")) {
    		return "bars";
    	} else if(Session.equals("mobileMode","addWork") || Session.equals("mobileMode","editWork")) {
    		return "times";
    	} else if(Session.equals("mobileMode", "viewWork") || Session.equals("mobileMode", "settings")) {
    		return "arrow-left";
    	}
    },
    select(type) {
    	return Session.equals("select", type);
    }
});

Template.mAddWork.rendered = function() {
	addMobileButton($('#dueDate'), 0.2, "brightness", function() {
		$('#dueDate').datepicker({
	        format: 'DD, MM d, yyyy',
	        clickInput: true,
	        startDate: 'd',
	        todayHighlight: true,
	        todayBtn: true,
	        autoclose: true
	    });
	});

	addMobileButton($('#class'), 0.2, "brightness", function() {
		Session.set("select", "class");
		toggleSidebar(true);
	});

	addMobileButton($('#type'), 0.2, "brightness", function() {
		Session.set("select", "type");
		toggleSidebar(true);
	});
}

Template.mEditWork.rendered = function() {
	addMobileButton($('#dueDate'), 0.2, "brightness", function() {
		$('#dueDate').datepicker({
	        format: 'DD, MM d, yyyy',
	        clickInput: true,
	        startDate: 'd',
	        todayHighlight: true,
	        todayBtn: true,
	        autoclose: true
	    });
	});

	addMobileButton($('#class'), 0.2, "brightness", function() {});

	addMobileButton($('#type'), 0.2, "brightness", function() {
		Session.set("select", "type");
		toggleSidebar(true);
	});

	/*addMobileButton($("#mDelete"), 0.2, "brightness", function() {

	})*/
}

Template.mAddWork.events({
	'input .restrict' (event) {
        var restrict = event.target.maxLength;
        var chars = restrict - event.target.value.length;
        var newSetting = Session.get("restrictText");
        newSetting[event.target.id] = (chars === restrict) ? "" : (chars.toString() + ((chars === 1) ? " character " : " characters ") + "left");
        newSetting.selected = event.target.id;
        Session.set("restrictText", newSetting);
    }
});

Template.mEditWork.events({
	'input .restrict' (event) {
        var restrict = event.target.maxLength;
        var chars = restrict - event.target.value.length;
        var newSetting = Session.get("restrictText");
        newSetting[event.target.id] = (chars === restrict) ? "" : (chars.toString() + ((chars === 1) ? " character " : " characters ") + "left");
        newSetting.selected = event.target.id;
        Session.set("restrictText", newSetting);
    },
    'click #mConfirm' () {
    	serverData = [Session.get("currentWork")._id, "confirmations"];
        sendData("toggleWork");
    },
    'click #mReport' () {
    	serverData = [Session.get("currentWork")._id, "reports"];
        sendData("toggleWork");
 	}
});

Template.mViewWork.events({
	'click #mConfirm' () {
    	serverData = [Session.get("currentWork")._id, "confirmations"];
        sendData("toggleWork");
    },
    'click #mReport' () {
    	serverData = [Session.get("currentWork")._id, "reports"];
        sendData("toggleWork");
 	}
});

Template.mSettings.rendered = function() {
	var options = ["theme", "timeHide", "done", "hideReport"];
	for(let i = 0; i < options.length; i++) {
		addMobileButton($("#"+options[i]), 0.05, "brightness", function() {
			Session.set("select", "options");
			Session.set("options", [options[i], $("#"+options[i])[0].children[0].innerHTML.replace(":","")]);
			toggleSidebar(true);
		});
	}
}

Template.mOptionCard.rendered = function() {
	var div = this.firstNode;
	addMobileButton(this.firstNode, 0.2, "brightness", function() {
		var newSetting = Session.get("user");
		var option = div.children[0].innerHTML;
        newSetting.preferences[Session.get("options")[0]] = (function() {
            var value = options[Session.get("options")[0]].filter(function(entry) {
                return option === entry.alias;
            })[0].val;
            return (Session.get("options")[0] === 'theme') ? themeColors[value] : value;
        })();
        Session.set("user", newSetting);
        serverData = Session.get("user");
        sendData("editProfile");
        toggleSidebar(false);
	});
}

addMobileButton = function(element, lighten, animateType, completeFunction) {
	let add = lighten;
	let type = animateType;
	let ele = jQuery(element);
	let execute = completeFunction;
	let care = true;

	let colors = [
		parseFloat($.Velocity.hook(ele, "backgroundColorRed")),
		parseFloat($.Velocity.hook(ele, "backgroundColorGreen")),
		parseFloat($.Velocity.hook(ele, "backgroundColorBlue")),
		parseFloat($.Velocity.hook(ele, "backgroundColorAlpha"))
	];

	ele.on('touchstart', function(e) {
		care = true;
		switch(type) {
			case "color":
				ele.velocity(
				{
					backgroundColorRed: colors[0] + add,
					backgroundColorGreen: colors[1] + add,
					backgroundColorBlue: colors[2] + add
				},100);
				break;
			case "brightness":
				ele.velocity({backgroundColorAlpha: colors[3] + add},100);
				break;
		}
	});

	ele.on('touchend', function(e) {
		if(!care) return;
		ele.velocity("stop");
		timeout = false;
		setTimeout(function() {
			timeout = true;
		}, 100);
		switch(type) {
			case "color":
				ele.velocity(
				{
					backgroundColorRed: colors[0],
					backgroundColorGreen: colors[1],
					backgroundColorBlue: colors[2]
				},
				{
					duration: 200,
					complete: execute()
				});
				break;
			case "brightness":
				ele.velocity(
				{
					backgroundColorAlpha: colors[3]
				},
				{
					duration: 200,
					complete: execute()
				});
				break;
		}
	});

	ele.on('touchmove', function(e) {
	    if (element !== document.elementFromPoint(e.originalEvent.touches[0].pageX,e.originalEvent.touches[0].pageY)) {
	        ele.mouseleave();
	    }
	})

	ele.on('mouseleave', function(e) {
		if(!care) return;
		care = false;
		switch(type) {
			case "color":
				ele.velocity(
				{
					backgroundColorRed: colors[0],
					backgroundColorGreen: colors[1],
					backgroundColorBlue: colors[2]
				},200);
				break;
			case "brightness":
				ele.velocity({backgroundColorAlpha: colors[3]},200);
				break;
		}
	});
}

function toggleSidebar(open) {
	if(open) {
		$("#mOverlay").velocity("fadeIn", 300);
		$("#mSidebar").velocity({left: '-3vw'}, 300);
	} else {
		$("#mOverlay").velocity("fadeOut", 300);
		$("#mSidebar").velocity(
		{
			left: '-100vw'
		}, 
		{
			duration: 300,
			complete: function() {
				$.Velocity.hook($("#mSidebar"), 'translateX', '0px');
				Session.set("select", "none");
			}
		});
	}
}

function timedPushback(type) {
	var fadeTime = 10;
	$(".mClassContainer").velocity("stop", true);
	if(!type) {
		setTimeout(function() {
			$(".mClassContainer").velocity({opacity: 1}, 0);
		}, fadeTime);	
	} else {
		$(".mClassContainer").velocity("fadeOut", fadeTime);
		setTimeout(function() {
			$(".mClassContainer").velocity({left: "-150vw"}, 0);
			$(".mClassContainer").velocity("fadeIn", 0);
			$(".mClassContainer").velocity({opacity: 1}, 0);
			var i = 0;
			var timer = setInterval(function() {
				$($(".mClassContainer")[i]).velocity({left: ""});
				if(i === $(".mClassContainer").length - 1) clearInterval(timer);
				i += 1;
			}, 100);
		}, fadeTime);
	}
}