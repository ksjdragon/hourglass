import { Template } from 'meteor/templating';

Template.NotFound.helpers({
	width() {
		return window.innerWidth.toString() + "px";
	},
	circle() {
		return .2*window.innerWidth.toString() + "px";
	},
	center() {
		return -.1*window.innerWidth.toString() + "px";
	},
	hea() {
		var h = .06*window.innerHeight;
		return "font-size:"+h.toString()+"px;margin-top:"+-.5*h.toString()+"px;";
	},
	dim() {
		return window.innerWidth.toString()+"px";
	},
	text() {
		var h = .4*window.innerHeight;
		return "width:"+h.toString()+"px;margin-left:"+-.5*h.toString()+"px;";
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

