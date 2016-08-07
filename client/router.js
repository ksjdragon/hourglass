 Router.route('/', function() {
  if (Meteor.user() != null) {
    this.render("main");
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