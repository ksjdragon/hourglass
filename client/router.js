 Router.route('/', function() {
  if (Meteor.user() != null) {
    this.render("header");
    this.render("menu");
    this.render("options");
  } else {
    this.redirect('/login');
  }
})

Router.route('/login', function() {
  if (Meteor.user() == null) {
    this.render("login");
  } else {
    this.redirect('/')
  }
}); 