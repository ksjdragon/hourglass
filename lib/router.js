function completeProfile() {
    if (Meteor.user().profile.complete) {
        return true;
    } else {
        return false;
    }
}

Router.route('/', {
    waitOn: function() {
        if(!Meteor.userId()) {
            return;
        } else if(Session.get("demo")) {
            return ["HIIII"];
        }
        return [
            Meteor.subscribe('classes', this.params._id),
            Meteor.subscribe('schools', this.params._id),
            Meteor.subscribe('teachers', this.params._id),
            Meteor.subscribe('work', this.params._id),
            Meteor.subscribe('requests', this.params._id),
            Meteor.subscribe('personalUser', this.params._id),
            Meteor.subscribe('users', this.params._id)
        ];
    },
    action: function() {
        if(Session.get("demo")) {
            Session.set("user", {
                "school":"Robot Academy",
                "grade":"2018",
                "classes": ["History", "Math", "Biology", "Literature"],
                "preferences": {
                    "theme": {
                        "background":"NeonBlue.jpg",
                        "mainColor":"#1D1C23",
                        "secondaryColor":"#1F212F",
                        "sidebarColor":"#312E32",
                        "userDropdownColor":"#2E312B",
                        "iconHighlight":"#70E6E6",
                        "modeHighlight":"#70E6E6",
                        "classCardColor":"#32363C",
                        "textColor":"#FCF0F0"
                    },
                "mode": "classes",
                "timeHide":0, 
                "done": true, 
                "hideReport": true},
                "name": "A. Robot",
                "complete": true
            });
            this.render("main");
            return;
        }
        if (!Meteor.userId() || !completeProfile()) {
            this.redirect('/login');
        } else {
            if(_.contains([null, undefined, ""], Meteor.user().profile.school ||
                          _.contains([null, undefined, ""], Meteor.user().profile.grade))) {
                this.redirect('/profile');
            } else {
                Session.set("user", Meteor.user().profile);
                if(Meteor.Device.isPhone()) {
                    this.render("mobile");
                } else {
                    this.render("main");
                }
            }
        }
    }
});

Router.route('/login', {
    action:  function() {
        if(Session.get("demo")) {
            this.redirect('/');
        }
        if (!Meteor.userId()) {
            if(Meteor.Device.isPhone()) {
                this.render("mLogin");
            } else {
                this.render("login");
            }
        } else if (!completeProfile()) {
            this.redirect('/profile');
        } else {
            this.redirect('/');
        }
    }
});

Router.route('/profile', {
    waitOn: function() {
        return [
            Meteor.subscribe('classes', this.params._id),
            Meteor.subscribe('schools', this.params._id),
            Meteor.subscribe('teachers', this.params._id),
            Meteor.subscribe('work', this.params._id),
            Meteor.subscribe('requests', this.params._id),
            Meteor.subscribe('personalUser', this.params._id),
            Meteor.subscribe('users', this.params._id)
        ];
    },
    action: function() {
        if (!Meteor.userId() || completeProfile()) {
            this.redirect('/login');
        } else {
            if(Meteor.Device.isPhone()) {
                this.render("mProfile");
            } else {
                this.render("profile");
            }
        }
    }
});

Router.configure({
    notFoundTemplate: "NotFound",
    loadingTemplate: "loading"
});
