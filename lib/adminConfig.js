AdminConfig = {
    name: 'Hourglass',
    collections: {
        schools: {
            icon: 'university',
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'Name', name: 'name' }  
            ],
            color: 'red',
            label: 'Schools'
        },
        teachers: {
            icon: 'book',
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'Name', name: 'name' },
                { label: 'School', name: 'school'}
            ],
            color: 'orange',
            label: 'Teachers'
        },
        classes: {
            icon: 'graduation-cap',
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'School', name: 'school' },
                { label: 'Name', name: 'name' },
                { label: 'Hour', name: 'hour' },
                { label: 'Teacher', name: 'teacher' },
                { label: 'Admin', name: 'admin', template: 'adminUserDisplay' },
                { label: 'Status', name: 'status', template: 'statusButton'},
                { label: 'Code', name: 'code' },
                { label: 'Privacy', name: 'privacy' },
                { label: 'Category', name: 'category' },
                { label: 'Moderators', name: 'moderators', template: 'adminUserDisplay' },
                { label: 'Banned', name: 'banned', template: 'adminUserDisplay' },
                { label: 'Subscribers', name: 'subscribers', template: 'adminUserDisplay'}
            ],
            color: 'blue',
            label: 'Classes'
        },
        work: {
            icon: 'pencil',
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'Class', name: 'class' },
                { label: 'Name', name: 'name' },
                { label: 'Due Date', name: 'dueDate' },
                { label: 'Description', name: 'description' },
                { label: 'Creator', name: 'creator', template: 'adminUserDisplay' },
                { label: 'Comments', name: 'comments' },
                { label: 'Confirmations', name: 'confirmations', template: 'adminUserDisplay' },
                { label: 'Reports', name: 'reports', template: 'adminUserDisplay' },
                { label: 'Done', name: 'done', template: 'adminUserDisplay' },
                { label: 'Type', name: 'type' }
            ],
            color: 'yellow',
            label: 'Work'
        },
        requests: {
            icon: 'exclamation-triangle',
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'User', name: 'requestor', template: 'adminUserDisplay' },
                { label: 'Request', name: 'request' },
                { label: 'Time', name: 'timeRequested' }
            ],
            color: 'green',
            label: 'Requests'
        },
        'Meteor.users': {
            icon: 'user',
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'Email', name: 'services.google.email' },
                { label: 'Name', name: 'profile.name' },
                { label: 'School', name: 'profile.school' },
                { label: 'Graduation Year', name:'profile.grade' },
                { label: 'Complete', name:'profile.complete'},
                { label: 'Icon', name: '_id', template: 'adminUserDisplay' },
            ],
            templates: {
                new: {
                    name: 'disableUser'
                },
                edit: {
                    name: 'userEditor'
                }
            },
            color: 'light-blue',
            label: 'Users'
        },
        admins: {
            icon: 'user-plus',
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'Email', name: 'services.google.email' },
                { label: 'Name', name: 'profile.name' },
                { label: 'School', name: 'profile.school' },
                { label: 'Graduation Year', name:'profile.grade' },
                { label: 'Complete', name:'profile.complete'},
                { label: 'Icon', name: '_id', template: 'adminUserDisplay' },
            ],
            templates: {
                new: {
                    name: 'createAdmin'
                },
                edit: {
                    name: 'disableUser'
                }
            },
            selector: function() {
                return {roles: {$elemMatch: {$eq: "admin"}}}
            },
            showEditColumn: false,
            color: 'purple',
            label: 'Admins'
        },

    }
};