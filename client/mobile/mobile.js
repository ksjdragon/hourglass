Session.set("mobileWork", []);

Template.mobile.rendered = function() {
    document.getElementsByTagName("body")[0].style.color = Session.get("user").preferences.theme.textColor;
}

Template.mobile.helpers({
	schoolName() { // Finds the name of the user's school.
        if (Session.get("user").school === undefined || Session.get("user").school === null) return;
        return Session.get("user").school;
    },
	iconStatus() {
		return (Session.get("sidebarMode") === "mobile") ? Session.get("user").preferences.theme.iconHighlight : "";
	},
	myWork() {
		var array = myClasses();
		var allWork = [];
		for(var i = 0; i < array.length; i++) {
			for(var j = 0; j < array[i].thisClassWork.length; j++) {
				allWork.push(array[i].thisClassWork[j]);
			}
		}
		Session.set("mobileWork", allWork);
		return allWork;
	}
});