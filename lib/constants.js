themeColors =  {
    "lux": {
        "background": "White.jpg",
        "mainColor": "#DBDBDB",
        "secondaryColor": "#567393",
        "sidebarColor": "#6C94B4",
        "userDropdownColor": "#E6E6E6",
        "iconHighlight": "#FFF",
        "modeHighlight": "#D34949",
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
        "modeHighlight": "#C9FE62",
        "classCardColor":"#302C36",
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
        "modeHighlight": "#B9F643",
        "classCardColor":"#C18311",
        "textColor": "#FCF0F0"  
    },
    "atlaneon": { 
       "background": "NeonBlue.jpg",
        "mainColor": "#1D1C23",
        "secondaryColor": "#1F212F",
        "sidebarColor": "#312E32",
        "userDropdownColor": "#2E312B", 
        "iconHighlight": "#70E6E6",
        "modeHighlight": "#70E6E6",
        "classCardColor":"#1FAAB1",
        "textColor": "#FCF0F0"
    }
};

workColors = {
    "normal": "#2E4F74",
    "quiz": "#409333",
    "test": "#AD3C44",
    "project": "#D8831A",
    "other": "#852E6D"
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

serverData = null;
confirm = null;

//Input Handling
modifyingInput = null;
clickDisabled = false;
optionOpen = false;