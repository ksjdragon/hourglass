Template.AdminLayout.created = function () {
  var self = this;

  self.minHeight = new ReactiveVar(
    $(window).height() - $('.main-header').height());

  $(window).resize(function () {
    self.minHeight.set($(window).height() - $('.main-header').height());
  });

  $('body').addClass('fixed');
};

Template.AdminLayout.destroyed = function () {
  $('body').removeClass('fixed');
};

Template.AdminLayout.helpers({
  minHeight: function () {
    return Template.instance().minHeight.get() + 'px'
  }
});

/* This helper is copied from https://github.com/yogiben/meteor-admin/blob/master/lib/client/js/helpers.coffee.
 I used this to remove the (irrelevant) Meteor.users collection from the dashboard and sidebar (the routes still exist).
 TODO: Maybe a future version of yogiben:admin could allow this without monkey-patching?
 */
UI.registerHelper("admin_collections", function() {
  var collections = {};
  if (typeof AdminConfig !== 'undefined' && typeof AdminConfig.collections === 'object')
    collections = AdminConfig.collections;
  // remove Meteor.users collection (see above)
  delete collections.Users;
  return _.map(collections, function(obj, key) {
    obj = _.extend(obj, { name: key });
    obj = _.defaults(obj, { label: key, icon: 'plus', color: 'blue' });
    return obj = _.extend(obj, {
      viewPath: Router.path("adminDashboard" + key + "View"),
      newPath: Router.path("adminDashboard" + key + "New")
    });
  });
});

dataTableOptions = {
    "aaSorting": [],
    "bPaginate": true,
    "bLengthChange": false,
    "bFilter": true,
    "bSort": true,
    "bInfo": true,
    "bAutoWidth": false
};
