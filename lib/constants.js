themeColors =  {
    "light": {
        "background": "White.jpg",
        "mainColor": "#EBEBEB",
        "secondaryColor": "#FEFEFE",
        "sidebarColor": "#65839A",
        "userDropdownColor": "#E6E6E6",
        "iconHighlight": "#33ADFF",
        "modeHighlight": "#FF1A1A",
        "classCardColor":"#EBEBEB",
        "textColor": "#000"
    },
    /*"dark": {
        "background": "Black.jpg",
        "mainColor": "#373A56",
        "secondaryColor": "#151A2B",
        "sidebarColor": "#35435D",
        "userDropdownColor": "#373A56", 
        "iconHighlight": "#33ADFF",
        "modeHighlight": "#FF1A1A",
        "classCardColor":"#46396E",
        "textColor": "#F6F6F6" 
    },*/
    /*"dark": {
       "background": "RedBlack.jpg",
        "mainColor": "#302c36",
        "secondaryColor": "#151313",
        "sidebarColor": "#327c5a",
        "userDropdownColor": "#cc3333", 
        "iconHighlight": "#327c5a",
        "modeHighlight": "#c9fe62",
        "classCardColor":"#302c36",
        "textColor": "#fcf0f0"  
    },*/
    /*"dark": {
       "background": "Sea.jpg",
        "mainColor": "#1e926c",
        "secondaryColor": "#1c564f",
        "sidebarColor": "#3cb08a",
        "userDropdownColor": "#2ea96a", 
        "iconHighlight": "#61d9a3",
        "modeHighlight": "#c9fe62",
        "classCardColor":"#2567a1",
        "textColor": "#fcf0f0"  
    },*/
    /*"dark": {
       "background": "Earth.jpg",
        "mainColor": "#dea743",
        "secondaryColor": "#496234",
        "sidebarColor": "#6d9957",
        "userDropdownColor": "#89bb52", 
        "iconHighlight": "#91ee61",
        "modeHighlight": "#b9f643",
        "classCardColor":"#c18311",
        "textColor": "#fcf0f0"  
    },*/
    "dark": {
       "background": "NeonBlue.jpg",
        "mainColor": "#1d1c23",
        "secondaryColor": "#1f212f",
        "sidebarColor": "#312e32",
        "userDropdownColor": "#2e312b", 
        "iconHighlight": "#70e6e6",
        "modeHighlight": "#70e6e6",
        "classCardColor":"#1faab1",
        "textColor": "#fcf0f0"
    }
};

options = {
    "theme": [
        {"val": "light", "alias": "Light"},
        {"val": "dark", "alias": "Dark"}
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
    ]
}

AdminConfig = {
    name: 'Hourglass',
    collections: {
        schools: {},
        classes: {},
        work: {},
        requests: {}
    }
};

serverData = null;