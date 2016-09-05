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
        this.render("main");
    }
});

Router.route('/login', function() {
    if (!Meteor.userId()) {
        this.render("login");
    } else if (!Meteor.user().profile.school) {
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
                Meteor.subscribe('classes', this.params._id),
                Meteor.subscribe('schools', this.params._id),
                Meteor.subscribe('work', this.params._id),
                Meteor.subscribe('requests', this.params._id),
                Meteor.subscribe('users', this.params._id)
            ];
        }
    },
    action: function() {
        this.render("profile");
    }
});

Router.route('/user/:email', {
    template: 'user',
    data: function() {
        return Meteor.users.findOne({'services.google.email': this.params.email});
    },
    waitOn: function() {
        return [
            Meteor.subscribe('users', this.params._id)
        ];
    }
});

Router.route('/admin', {
    waitOn: function() {
        if (Roles.userIsInRole(Meteor.userId(), ['admin', 'superadmin'])) {
            return [
                Meteor.subscribe('classes', this.params._id),
                Meteor.subscribe('schools', this.params._id),
                Meteor.subscribe('work', this.params._id),
                Meteor.subscribe('requests', this.params._id),
                Meteor.subscribe('users', this.params._id)
            ];
        } else {
            this.render('NotFound');
        }
    },
    action: function() {
        this.render("admin");
    }
});

Router.configure({
    notFoundTemplate: "NotFound"
});
