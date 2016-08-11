Router.route('/', function() {
    if (!Meteor.userId()) {
        this.redirect('/login');
    } else {
        this.render("main");
    }
});

Router.route('/login', function() {
    if (!Meteor.userId()) {
        this.render("login");
    } else if (Object.keys(Meteor.user().profile).length <= 1) {
        this.redirect('/profile');
    } else {
        this.redirect('/')
    }
});

Router.route('/profile', function() {
    if (!Meteor.userId()) {
        this.redirect("/login");
    } else {
        this.render("profile");
    }
});

Router.configure({
    notFoundTemplate: "NotFound"
});