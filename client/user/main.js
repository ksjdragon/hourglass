Template.user.helpers({
    // this refers to current user object
    'testhelper': function() {
        return this.profile.name;
    }
});
