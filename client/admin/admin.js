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
			});
		}
		return userInfo;
	}
});

Template.statusButton.helpers({
	status() {
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
			if(!openUserDisplay[0].contains(event.target)) {
				openUserDisplay.fadeOut(200, function() {
					openUserDisplay = null;
				});
			}
		}
	}
});

Template.statusButton.events({
	'click .approveStatus' () {
		Meteor.call("approveClass", this.doc._id);
	}
});

Template.userEditor.helpers({
	userInfo : function() {
		return Session.get("admin_doc")
	},
	superAdmin: function() {
		return Roles.userIsInRole(Meteor.userId(), ['superadmin']);
	}
});

Template.createAdmin.helpers({
	userComplete() {
		return {
            position: "bottom",
            limit: 7,
            rules: [{
                token: '',
                collection: Meteor.users,
                field: 'services.google.email',
                filter: {roles: {$not: {$elemMatch: {$eq: "admin"}}}},
                template: Template.simpleUser
            }]
        };
	},
	superAdmin: function() {
		return Roles.userIsInRole(Meteor.userId(), ['superadmin']);
	}
});

Template.createAdmin.events({
	'click #addAdmin' () {
		var value = document.getElementsByClassName("form-control")[0].value;
		var user = Meteor.users.findOne({'services.google.email': value});
		if(user === undefined) return;
		Meteor.call("addAdmin", user._id);
	}
})