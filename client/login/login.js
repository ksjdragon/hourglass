/* jshint esversion: 6 */
import {
    Template
} from 'meteor/templating';

var circle = window.innerHeight * 1.1;
var content = window.innerHeight * 0.6;
Template.login.helpers({
    width() { // Returns width of screen
        return window.innerWidth.toString() + "px";
    },
    height() { // Returns height of screen
        return window.innerHeight.toString() + "px";
    },
    dim() { // Dimensions of circle container
        return circle.toString() + "px";
    },
    margin() { // Centers circle container
        let margin = (-circle / 2).toString() + "px";
        return margin + " 0 0 " + margin;
    },
    contDim() { // Dimensions the dimensions of the information container
        return content.toString() + "px";
    },
    contMargin() { // Centers information container
        let margin = (-content / 2).toString() + "px";
        return margin + " 0 0 " + margin;
    },
    logo() { // Dimensions logo
        return window.innerHeight * 0.08;
    },
    hea() { // Styles the login button
        var w = 0.09 * window.innerWidth;
        return "width:" + w.toString() + "px;left:" + (-10 + -0.5 * w + content / 2).toString() + "px;";
    }
});

Template.login.events({
    'click #loginButton' () {
        document.getElementById("login-buttons-google").click();
    }
});
