Router.route('/', {
    waitOn: function() {
        if (!Meteor.userId()) {
            this.redirect('/login');
        } else {
            return [
                Meteor.subscribe('classes',this.params._id),
                Meteor.subscribe('schools',this.params._id),
                Meteor.subscribe('work',this.params._id),
                Meteor.subscribe('users',this.params._id)
            ];
        }
    },
    action: function() { 
        this.render("main");
    }
});

Router.route('/login', function() {
    if (!Meteor.userId()) {
        this.render("login");
    } else if (Object.keys(Meteor.user().profile).length <= 1) {
        this.redirect('/profile');
    } else {
        this.redirect('/');
    }
});

Router.route('/profile', {
    waitOn: function() {
        if (!Meteor.userId()) {
            this.redirect('/login');
        } else {
            return [
                Meteor.subscribe('classes',this.params._id),
                Meteor.subscribe('schools',this.params._id),
                Meteor.subscribe('work',this.params._id),
                Meteor.subscribe('users',this.params._id)
            ];
        }
    },
    action: function() { 
        this.render("profile");
    }
});

Router.route('/admin', function() {
    if (Roles.userIsInRole(Meteor.userId(), ['admin', 'superadmin'])) {
        this.render("admin");
    } else {
        this.redirect('/login');
    }
});

Router.configure({
    notFoundTemplate: "NotFound"
});
