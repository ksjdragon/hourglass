import { Template } from 'meteor/templating';

var circle = window.innerHeight * 1.1;
var content = window.innerHeight * .6;
Template.login.helpers({
	width() {
		return window.innerWidth.toString() + "px";
	},
	dim() {
		return circle.toString() + "px";
	},
	margin() {
	 	let margin = (-circle/2).toString()+"px";
		return margin+" 0 0 "+margin;
	},
	contDim() {
		return content.toString() + "px";
	},
	contMargin() {
		let margin = (-content/2).toString()+"px";
		return margin+" 0 0 "+margin;
	},
	logo() {
		return window.innerHeight * .08;
	},
	hea() {
		var w = .09*window.innerWidth;
		return "width:"+w.toString()+"px;left:"+(-.5*w+content/2).toString()+"px;";
	}
})

Template.login.events({
	'click #loginButton' () {
		document.getElementById("login-buttons-google").click();
	}
})

