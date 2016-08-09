 Router.route('/', function() {
  if (Meteor.user() != null) {
    this.render("main");
  } else {
    this.redirect('/login');
  }
});

Router.route('/login', function() {
  if (Meteor.user() == null) {
    this.render("login");
  } else if (Object.keys(Meteor.user().profile).length <= 1) {
    this.redirect('/create')
  } else {
    this.redirect('/')
  }
});

Router.route('/profile', function() {
  if (Meteor.user() != null) {
    this.render("profile");
  } else {
    this.redirect("/login");
  }
});

Router.configure({
  notFoundTemplate: "NotFound"
});