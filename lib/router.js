function completeProfile() {
    if (Meteor.user().profile.complete) {
        return true;
    } else {
        return false;
    }
}

Router.route('/', {
    waitOn: function() {
        if(!Meteor.userId()) {
            return;
        }
        return [
            Meteor.subscribe('classes', this.params._id),
            Meteor.subscribe('schools', this.params._id),
            Meteor.subscribe('teachers', this.params._id),
            Meteor.subscribe('work', this.params._id),
            Meteor.subscribe('requests', this.params._id),
            Meteor.subscribe('personalUser', this.params._id),
            Meteor.subscribe('users', this.params._id)
        ];
    },
    action: function() {
        if (!Meteor.userId() || !completeProfile()) {
            this.redirect('/login');
        } else {
            if(_.contains([null, undefined, ""], Meteor.user().profile.school ||
                          _.contains([null, undefined, ""], Meteor.user().profile.grade))) {
                this.redirect('/profile');
            } else {
                Session.set("user", Meteor.user().profile);
                if(Meteor.Device.isPhone()) {
                    this.render("mobile");
                } else {
                    this.render("main");
                }
                
                
            }
        }
    }
});

Router.route('/login', {
    action:  function() {
        if (!Meteor.userId()) {
            if(Meteor.Device.isPhone()) {
                this.render("mLogin");
            } else {
                this.render("login");
            }
        } else if (!completeProfile()) {
            this.redirect('/profile');
        } else {
            this.redirect('/');
        }
    }
});

Router.route('/profile', {
    waitOn: function() {
        return [
            Meteor.subscribe('classes', this.params._id),
            Meteor.subscribe('schools', this.params._id),
            Meteor.subscribe('teachers', this.params._id),
            Meteor.subscribe('work', this.params._id),
            Meteor.subscribe('requests', this.params._id),
            Meteor.subscribe('personalUser', this.params._id),
            Meteor.subscribe('users', this.params._id)
        ];
    },
    action: function() {
        if (!Meteor.userId() || completeProfile()) {
            this.redirect('/login');
        } else {
            this.render("profile");
        }
    }
});

Router.configure({
    notFoundTemplate: "NotFound"
});
