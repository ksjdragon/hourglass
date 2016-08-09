import { Template } from 'meteor/templating';

Template.NotFound.helpers({
	width() {
		return window.innerWidth.toString() + "px";
	},
	circle() {
		return .25*window.innerWidth.toString() + "px";
	},
	center() {
		return -.125*window.innerWidth.toString() + "px";
	},
	hea() {
		var h = .08*window.innerHeight;
		return "font-size:"+h.toString()+"px;margin-top:"+-.5*h.toString()+"px;";
	}
})

Template.NotFound.events({
	'click #back' () {
		window.location = window.history.back();
	},
	'click #main' () {
		window.location = "/";
	}
})

