themeColors =  {
    "lux": {
        "background": "White.jpg",
        "mainColor": "#D9D9D9",
        "secondaryColor": "#E8E8E8",
        "sidebarColor": "#65839A",
        "userDropdownColor": "#E6E6E6",
        "iconHighlight": "#8695CF",
        "modeHighlight": "#AA2121",
        "classCardColor":"#EBEBEB",
        "textColor": "#000"
    },
    "nox": {
        "background": "Black.jpg",
        "mainColor": "#373A56",
        "secondaryColor": "#151A2B",
        "sidebarColor": "#35435D",
        "userDropdownColor": "#373A56", 
        "iconHighlight": "#33ADFF",
        "modeHighlight": "#FF1A1A",
        "classCardColor":"#46396E",
        "textColor": "#F6F6F6" 
    },
    "requom": {
       "background": "RedBlack.jpg",
        "mainColor": "#302C36",
        "secondaryColor": "#B93A3A",
        "sidebarColor": "#327C5A",
        "userDropdownColor": "#CC3333", 
        "iconHighlight": "#327C5A",
        "modeHighlight": "#C9fE62",
        "classCardColor":"#302c36",
        "textColor": "#FCF0F0"  
    },
    "aequor": {
       "background": "Sea.jpg",
        "mainColor": "#1E926C",
        "secondaryColor": "#1C564F",
        "sidebarColor": "#1C7458",
        "userDropdownColor": "#2EA96A", 
        "iconHighlight": "#61D9A3",
        "modeHighlight": "#C9FE62",
        "classCardColor":"#2567A1",
        "textColor": "#FCF0F0"  
    },
    "fresva": {
       "background": "Earth.jpg",
        "mainColor": "#DEA743",
        "secondaryColor": "#496234",
        "sidebarColor": "#6D9957",
        "userDropdownColor": "#89BB52", 
        "iconHighlight": "#91EE61",
        "modeHighlight": "#B9f643",
        "classCardColor":"#C18311",
        "textColor": "#FCF0F0"  
    },
    "atlaneon": { 
       "background": "NeonBlue.jpg",
        "mainColor": "#1D1C23",
        "secondaryColor": "#1F212f",
        "sidebarColor": "#312E32",
        "userDropdownColor": "#2e312b", 
        "iconHighlight": "#70E6E6",
        "modeHighlight": "#70E6E6",
        "classCardColor":"#1FAAB1",
        "textColor": "#FCF0F0"
    }
};

options = {
    "theme": [
        {"val": "lux", "alias": "Lux"},
        {"val": "nox", "alias": "Nox"},
        {"val": "requom", "alias": "Recoum"},
        {"val": "aequor", "alias": "Aequor"},
        {"val": "fresva", "alias": "Fresva"},
        {"val": "atlaneon", "alias": "Atlaneon"}
    ],
    "mode": [
        {"val": "classes", "alias": "Classes"},
        {"val": "calendar", "alias": "Calendar"}
    ],
    "timeHide": [
        {"val": 1, "alias": "1 Day"},
        {"val": 2, "alias": "2 Days"},
        {"val": 7, "alias": "1 Week"},
        {"val": 30, "alias": "1 Month"},
        {"val": 0, "alias": "Never"}
    ],
    "done": [
        {"val": true, "alias": "Yes"},
        {"val": false, "alias": "No"}
    ],
    "hideReport": [
        {"val": true, "alias": "Yes"},
        {"val": false, "alias": "No"}
    ],
    "type": [
        {"val": "normal", "alias": "Normal"},
        {"val": "quiz", "alias": "Quiz"},
        {"val": "test", "alias": "Test"},
        {"val": "project", "alias": "Project"},
        {"val": "other", "alias": "Other"},
    ],
    "privacy": [
        {"val": false, "alias": "Public"},
        {"val": true, "alias": "Private"}
    ],
    "category": [
        {"val": "class", "alias": "Class"},
        {"val": "club", "alias": "Club"},
        {"val": "other", "alias": "Other"}
    ]
}

AdminConfig = {
    name: 'Hourglass',
    collections: {
        schools: {
            icon: 'university',
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'Name', name: 'name' }  
            ],
            color: 'red'
        },
        classes: {
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'School', name: 'school' },
                { label: 'Name', name: 'name' },
                { label: 'Hour', name: 'hour' },
                { label: 'Teacher', name: 'teacher' },
                { label: 'Admin', name: 'admin' },
                { label: 'Status', name: 'status' },
                { label: 'Code', name: 'code' },
                { label: 'Privacy', name: 'privacy' },
                { label: 'Category', name: 'category' },
                { label: 'Moderators', name: 'moderators' },
                { label: 'Banned', name: 'banned' },
                { label: 'Subscribers', name: 'subscribers' }
            ],
            color: 'blue'
        },
        work: {
            tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'Class', name: 'class' },
                { label: 'Name', name: 'name' },
                { label: 'Due Date', name: 'dueDate' },
                { label: 'Description', name: 'description' },
                { label: 'Creator', name: 'creator' },
                { label: 'Comments', name: 'comments' },
                { label: 'Confirmations', name: 'confirmations' },
                { label: 'Reports', name: 'reports' },
                { label: 'Done', name: 'done' },
                { label: 'Type', name: 'type' }
            ],
            color: 'yellow'
        },
        requests: {
           tableColumns: [
                { label: 'ID', name: '_id' },
                { label: 'User', name: 'requestor' },
                { label: 'Request', name: 'request' },
                { label: 'Time', name: 'timeRequested' }
            ],
            color: 'green'
        }
    }
};

serverData = null;