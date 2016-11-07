Router.route('/', {
    waitOn: function() {
        if (!Meteor.userId()) {
            this.redirect('/login');
        } else {
            return [
                Meteor.subscribe('classes', this.params._id),
                Meteor.subscribe('schools', this.params._id),
                Meteor.subscribe('work', this.params._id),
                Meteor.subscribe('requests', this.params._id),
                Meteor.subscribe('users', this.params._id)
            ];
        }
    },
    action: function() {
        if(_.contains([null, undefined, ""], Meteor.user().profile.school ||
                      _.contains([null, undefined, ""], Meteor.user().profile.grade))) {
            this.redirect('/profile');
        } else {
            Session.set("user", Meteor.user().profile);
            this.render("main");
        }
    }
});

Router.route('/login', {
    action:  function() {
        if (!Meteor.userId()) {
            this.render("login");
        } else if (!Meteor.user().profile.school) {
            Session.set("user", Meteor.user().profile);
            this.redirect('/profile');
        } else {
            Session.set("user", Meteor.user().profile);
            this.redirect('/');
        }
    }
});

Router.route('/profile', {
    waitOn: function() {
        if (!Meteor.userId()) {
            this.redirect('/login');
        } else {
            return [
                Meteor.subscribe('classes', this.params._id),
                Meteor.subscribe('schools', this.params._id),
                Meteor.subscribe('work', this.params._id),
                Meteor.subscribe('requests', this.params._id),
                Meteor.subscribe('users', this.params._id)
            ];
        }
    },
    action: function() {
        Session.set("user", Meteor.user().profile);
        this.render("profile");
    }
});

Router.route('/user/:email', {
    data: function() {
        return Meteor.users.findOne({'services.google.email': this.params.email});
    },
    waitOn: function() {
        return [
            Meteor.subscribe('users', this.params._id)
        ];
    },
    action: function() {
        if(Meteor.users.findOne({'services.google.email': this.params.email}) !== undefined) {
            if(Meteor.user() && this.params.email === Meteor.user().services.google.email) {
                Session.set("user", Meteor.user().profile);
                this.redirect('/profile');
            } else {
                Session.set("user", Meteor.user().profile);
                this.render('user');
            }
        } else {
            this.render("NotFound");
        }
    }
});

Router.configure({
    notFoundTemplate: "NotFound"
});
