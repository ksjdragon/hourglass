import {
    Template
} from 'meteor/templating';

Template.NotFound.helpers({
    width() {
        return window.innerWidth.toString() + "px";
    },
    circle() { // Sets size for circular buttons
        return .2 * window.innerWidth.toString() + "px"; 
    },
    center() { // Aligns text for circular buttons
        return -.1 * window.innerWidth.toString() + "px"; 
    },
    hea() { // Controls size and centering of text in buttons
        var h = .06 * window.innerHeight;
        return "font-size:" + h.toString() + "px;margin-top:" + -.5 * h.toString() + "px;";
    },
    dim() { // Dimensions divisions
        return window.innerWidth.toString() + "px";
    },
    text() { // Controls the size and centering of title text
        var h = .4 * window.innerHeight; 
        return "width:" + h.toString() + "px;margin-left:" + -.5 * h.toString() + "px;";
    }
})

Template.NotFound.events({
    'click #back' () { // Takes you to last seen page
        window.location = window.history.back();
    },
    'click #main' () { // Takes you to main page
        window.location = "/";
    }
})
