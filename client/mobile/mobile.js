Session.set("mobileWork", []);
Session.set("mobileMode", "main");
Session.set("mobileSidebar", false);
Session.set("classDisp", []);
Session.set("typeFilter", []);

var filterOpen = [false, true, true];

Template.mobile.rendered = function() {
	document.getElementsByTagName("body")[0].style.color = Session.get("user").preferences.theme.textColor;
	
	addMobileButton($("#mAddWork")[0], 50, "color", function() {
		$("#mAddWork").velocity("fadeOut", 200);
		$("#mobileBody").velocity("fadeOut", {
			duration: 200,
			complete: function() {
				Session.set("mobileMode", "addWork");
				$("#mobileBody").velocity("fadeIn", 200);
			}
		});
	});

	addMobileButton($("#mSidebarToggle")[0], 0.2, "brightness", function() {
		Session.set("mobileSidebar", true);
		toggleSidebar(true);
	});

	addMobileButton($(".mSectionMode")[0], 0.2, "brightness", function() {
		if(Session.equals("mobileMode", "main")) {
			toggleSidebar(false);
		} else {
			Session.set("mobileMode","main");
			toggleSidebar(false);
			timedPushback();
		}
	});

	addMobileButton($(".mSectionMode")[1], 0.2, "brightness", function() {
		if(Session.equals("mobileMode", "done")) {
			toggleSidebar(false);
		} else {
			Session.set("mobileMode","done");
			toggleSidebar(false);
			timedPushback();
		}
	});

	addMobileButton($("#mSettings"), 0.1, "brightness" , function() {
		console.log("Go to settings!"); // Render setting template
	});

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
        timedPushback();
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
			$.Velocity.hook(jQuery(e.target), 'translateX', dX/70 + 'px');
		} else {
			$.Velocity.hook(jQuery(e.target), 'translateX', dX + 'px');
		}
	});

	sidebar.on('panend', function(e) {
		deltaX += (e.originalEvent.gesture.deltaX);
		if(deltaX >= -window.innerWidth * 0.4) {
			deltaX = 0;
			jQuery(e.target).velocity({'translateX': "0px"}, 150);
		} else {
			deltaX = 0;
			toggleSidebar(false);

		}
	});
	timedPushback();
}


Template.mobileClass.rendered = function() {
	var deltaX = 0;
	var clearTile;
	let movable = jQuery(this.firstNode.children[2]);
	let undo = [jQuery(this.firstNode.children[0]), jQuery(this.firstNode.children[1])]

	new Hammer(movable[0], {
		domEvents: true
	});

	movable.on('panmove', function(e) {
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

	addMobileButton(undo[1], 30, "color", function() {
		clearTimeout(clearTile);
		movable.velocity({translateX: "0px"},300);
		undo[0].velocity("fadeOut", {duration: 300});
		undo[1].velocity("fadeOut", {duration: 300});
	});
}

Template.mSidebarClasses.rendered = function() {
	let div = this.firstNode;
	addMobileButton(div, 0.1, "brightness", function() {
       	var classid = div.getAttribute("classid");
        var array = Session.get("classDisp");
        if (array.indexOf(classid) !== -1) {
            array.splice(array.indexOf(classid), 1);
        } else {
            array.push(classid);
        }
        Session.set("classDisp", array);
        timedPushback();
	});
}

Template.mSideTypeFilter.rendered = function() {
	let div = this.firstNode;
	addMobileButton(div, 0.1, "brightness", function() {
		var type = div.getAttribute("type");
    	var array = Session.get("typeFilter");
        if (array.indexOf(type) !== -1) {
            array.splice(array.indexOf(type), 1);
        } else {
            array.push(type);
        }
        Session.set("typeFilter", array);
        timedPushback();
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
		var array = myClasses();
		var notDoneWork = [];
		var doneWork = [];
		for(var i = 0; i < array.length; i++) {
			for(var j = 0; j < array[i].thisClassWork.length; j++) {
				var classid = array[i].thisClassWork[j].classid;
				var desc = array[i].thisClassWork[j].description;
				if(desc) {
					array[i].thisClassWork[j].shortdesc = (desc.length <= 40 ) ? desc : desc.substring(0,40) +"...";
				}
				array[i].thisClassWork[j]["class"] = (classid === Meteor.userId()) ? "Personal" : classes.findOne({_id:classid}).name;
				if(_.contains(array[i].thisClassWork[j].done, Meteor.userId())) {
					array[i].thisClassWork[j].isDone = true;
					doneWork.push(array[i].thisClassWork[j]);
				} else {
					notDoneWork.push(array[i].thisClassWork[j]);
				}
			}
		}
		doneWork = doneWork.sort(function(a,b) {
			return Date.parse(a.realDate) - Date.parse(b.realDate);
		});
		notDoneWork = notDoneWork.sort(function(a,b) {
			return Date.parse(a.realDate) - Date.parse(b.realDate);
		});

		Session.set("mobileWork", [notDoneWork, doneWork]);
		return (done === "done") ? Session.get("mobileWork")[1] : Session.get("mobileWork")[0];
	},
	showMode(mode) {
		return Session.equals("mobileMode", mode);
	},
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
    },
    noMain() {
    	try {
    		return (Session.get("mobileWork")[0].length === 0) ? "block" : "none";	
    	} catch(err) {}
    },
    noDone() {
    	try {
    		return (Session.get("mobileWork")[1].length === 0) ? "block" : "none";
    	} catch(err) {}
    }
});

function addMobileButton(element, lighten, animateType, completeFunction) {
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
					backgroundColorBlue: colors[2] + add,
				},100);
			case "brightness":
				ele.velocity({backgroundColorAlpha: colors[3] + add},100);
		}
	});

	ele.on('touchend', function(e) {
		if(!care) return;
		ele.velocity("stop");
		switch(type) {
			case "color":
				ele.velocity(
				{
					backgroundColorRed: colors[0],
					backgroundColorGreen: colors[1],
					backgroundColorBlue: colors[2],
				},
				{
					duration: 200,
					complete: execute()
				});
			case "brightness":
				ele.velocity(
				{
					backgroundColorAlpha: colors[3]
				},
				{
					duration: 200,
					complete: execute()
				});
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
					backgroundColorBlue: colors[2],
				},200);
			case "brightness":
				ele.velocity({backgroundColorAlpha: colors[3]},200);
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
			}
		});
	}
}

function timedPushback() {
	$(".mobileClass").velocity("stop", true);
	if($(".mClassContainer").length === 0) {
		$(".mNoneText").velocity("fadeOut", {
			duration: 100,
			complete: function() {
				$(".mClassContainer").velocity({left: "-150vw"}, 0);
				$(".mClassContainer").velocity("fadeIn", 0);
				var i = 0;
				var timer = setInterval(function() {
					$($(".mClassContainer")[i]).velocity({left: ""});
					if(i === $(".mClassContainer").length - 1) clearInterval(timer);
					i += 1;
				}, 100);
			}
		});
	} else {
		$(".mClassContainer").velocity("fadeOut", {
			duration: 100,
			complete: function() {
				$(".mClassContainer").velocity({left: "-150vw"}, 0);
				$(".mClassContainer").velocity("fadeIn", 0);
				var i = 0;
				var timer = setInterval(function() {
					$($(".mClassContainer")[i]).velocity({left: ""});
					if(i === $(".mClassContainer").length - 1) clearInterval(timer);
					i += 1;
				}, 100);
			}
		});
	}
}