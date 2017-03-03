Session.set("mobileWork", []);
Session.set("mobileMode", "main");
Session.set("mobileSidebar", false);

Template.mobile.rendered = function() {
	document.getElementsByTagName("body")[0].style.color = Session.get("user").preferences.theme.textColor;

	addListeners();
	
	addMobileButton($("#mAddWork")[0], 50, function() {
		$("#mAddWork").velocity("fadeOut", 200);
		$("#mobileBody").velocity("fadeOut", {
			duration: 200,
			complete: function() {
				Session.set("mobileMode", "addWork");
				$("#mobileBody").velocity("fadeIn", 200);
			}
		});
	});

	addMobileSideButton($("#mSidebarToggle")[0], 0.2, function() {
		Session.set("mobileSidebar", true);
		toggleSidebar(true);
	});

	addMobileSideButton($(".mSectionMode")[0], 0.2, function() {
		Session.set("mobileMode","main");
		toggleSidebar(false);
	});

	addMobileSideButton($(".mSectionMode")[1], 0.2, function() {
		Session.set("mobileMode","done");
		toggleSidebar(false);
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
    }

});

function addListeners() {
	var deltaX = 0;
	var clearTile;
	for(var i = 0; i < $(".mClassContainer").length; i++) {
		let id = $(".mClassContainer")[i].getAttribute("workid");
		new Hammer($(".mobileClass")[i], {
			domEvents: true
		});
		$(".mobileClass[workid="+id+"]").on('panmove', function(e) {
			var dX = deltaX + (e.originalEvent.gesture.deltaX);
			if(dX < 0) {
				$.Velocity.hook(jQuery(e.target), 'translateX', dX/45 + 'px');
			} else {
				$.Velocity.hook(jQuery(e.target), 'translateX', dX + 'px');
			}
			
		});
		$(".mobileClass[workid="+id+"]").on('panend', function(e) {
			if(e.target === document.getElementById("mobileBody")) return;
			deltaX = deltaX + (e.originalEvent.gesture.deltaX);
			if(deltaX >= window.innerWidth * 0.5) {
				deltaX = 0;
				jQuery(e.target).velocity(
				{
					translateX: window.innerWidth*1.2+"px"
				},
				{
					duration: 150,
					complete: function() {
						$(".mUndoText[workid="+id+"]").velocity("fadeIn", {duration: 300});
						$(".mUndo[workid="+id+"]").velocity("fadeIn", {duration: 300});
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
						}, 3000);
					}
				});

			} else {
				deltaX = 0;
				jQuery(e.target).velocity({translateX: "0px"},300);
			}
		});

		addMobileButton($(".mUndo[workid="+id+"]")[0], 30, function() {
			clearTimeout(clearTile);
			$(".mobileClass[workid="+id+"]").velocity({translateX: "0px"},300);
			$(".mUndoText[workid="+id+"]").velocity("fadeOut", {duration: 300});
			$(".mUndo[workid="+id+"]").velocity("fadeOut", {duration: 300});
		});
	}
}

function addMobileButton(element, lighten, thisFunction) {
	let button = new Hammer.Manager(element);
	let add = lighten;
	let ele = jQuery(element);
	let execute = thisFunction;
	let colors = [
		parseFloat($.Velocity.hook(ele, "backgroundColorRed")),
		parseFloat($.Velocity.hook(ele, "backgroundColorGreen")),
		parseFloat($.Velocity.hook(ele, "backgroundColorBlue"))
	];
	var press = new Hammer.Press({
		event: 'press',
		pointers: 1,
		time: 0.01,
		threshold: 3000
	});

	button.add(press);

	button.on('press', function(e) {
		ele.velocity(
		{
			backgroundColorRed: colors[0] + add,
			backgroundColorGreen: colors[1] + add,
			backgroundColorBlue: colors[2] + add,
		},100);
	});

	ele.bind('touchend', function(e) {
		ele.velocity("stop");
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
	});
}

function addMobileSideButton(element, lighten, thisFunction) {
	let button = new Hammer.Manager(element);
	let add = lighten;
	let ele = jQuery(element);
	let execute = thisFunction;
	let care = true;

	let colors = parseFloat($.Velocity.hook(ele, "backgroundColorAlpha"));

	var press = new Hammer.Press({
		event: 'press',
		pointers: 1,
		time: 0.01
	});

	var pan = new Hammer.Pan();

	button.add(press);
	button.add(pan);

	button.on('press', function(e) {
		care = true;
		ele.velocity({backgroundColorAlpha: colors + add},100);
	});

	button.on('pan', function(e) {
		if(element !== document.elementFromPoint(e.pX, e.pY)) {
			care = false;
			ele.velocity("stop");
			ele.velocity({backgroundColorAlpha: colors}, 200);
		}
	});

	ele.bind('touchend', function(e) {
		if(!care) return;
		ele.velocity("stop");
		ele.velocity(
		{
			backgroundColorAlpha: colors
		},
		{
			duration: 200,
			complete: execute()
		});
	});
}

function toggleSidebar(open) {
	if(open) {
		$("#mOverlay").velocity("fadeIn", 300);
		$("#mSidebar").velocity({left: '0vw'}, 300);
	} else {
		$("#mOverlay").velocity("fadeOut", 300);
		$("#mSidebar").velocity({left: '-100vw'});
	}
}