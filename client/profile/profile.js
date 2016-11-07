/* jshint esversion: 6 */
import {
    Template
} from 'meteor/templating';

Template.profile.helpers({
    schoolgradenext() {
        if(_.contains([null, undefined, ""], Meteor.user().profile.school ||
                      _.contains([null, undefined, ""], Meteor.user().profile.grade))) {
            return "";
        } else {
            return "disabled";
        }
    }
});

Template.profile.events({
    'click #schoolnext' () {
        // Animation to display class section
    }
});
