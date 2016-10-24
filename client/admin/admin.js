var inInfo = false;
var openUserDisplay = null;

Template.adminUserDisplay.helpers({
	info() {
		var ids = (this.value instanceof Array) ? this.value : [this.value];
		var userInfo = [];
		for(var i = 0; i < ids.length; i++) {
			var user = Meteor.users.findOne({_id: ids[i]});
			userInfo.push({
				name: user.profile.name,
				email: user.services.google.email,
				id: user._id,
				icon: user.services.google.picture
			})
		}
		return userInfo;
	}
});

Template.statusButton.helpers({
	status() {
		console.log(this.value);
	 	return (this.value) ? "on" : "off";
	}
});

Template.adminUserDisplay.events({
	'click .adminUserIcon' (event) {
		var icoCoords = $(event.target)[0].getBoundingClientRect();
		var x = window.innerWidth - icoCoords.right;
		var y = icoCoords.bottom;
		openUserDisplay = $(event.target).next();
		$(".adminUserInfo").fadeOut(200);
		openUserDisplay
		.css({'right': x, 'top': y})
		.fadeIn(200);
	},
	'mouseenter .adminUserInfo' () {
		inInfo = true;
	},
	'mouseleave .adminUserInfo' (event) {
		if(inInfo) openUserDisplay.fadeOut(200);
		inInfo = false;
		openUserDisplay = null;
	}
});

Template.AdminLTE.events({
	'click' (event) {
		if(!event.target.className.includes("adminUserInfo") &&
		!event.target.className.includes("adminUserIcon") && 
		openUserDisplay !== null) {
			openUserDisplay.fadeOut(200);
			openUserDisplay = null;
		}
	}
});

Template.statusButton.events({
	'click .approveStatus' () {
		console.log(this.doc._id);
		Meteor.call("approveClass", this.doc._id);
	}
})

