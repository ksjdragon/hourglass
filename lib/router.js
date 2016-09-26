Router.route('/', {
    waitOn: function() {
        if (!Meteor.userId() || !Meteor.user().profile.school) {
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
            if(this.params.email === Meteor.user().services.google.email) {
                this.redirect('/profile');
            } else {
                this.render('user');
            }  
        } else {
            this.render("NotFound");
        }  
    }
});

/*Router.route('/admin', {
    action: function() {
        console.log("hi");
        if (!Roles.userIsInRole(Meteor.userId(), ['admin', 'superadmin'])) {
            this.redirect("/");
        } else {
            this.render("admin");
        }
    }
});*/

Router.configure({
    notFoundTemplate: "NotFound"
});
