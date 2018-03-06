// toggle class active for the sidebar
$(document).ready(function () {
    
    'use strict';
    
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
        $('#upperNav').toggleClass('active');
    });
});


// Wonders List
var wondersList = [
    {
        title: 'Great Wall of China',

        location: {
            lat: 40.4319077,
            lng: 116.5703749
        },

        id: 1
    },
    {
        title: 'Christ the Redeemer Statue',

        location: {
            lat: -22.951916,
            lng: -43.2104872
        },

        id: 2
    },
    {
        title: 'Machu Picchu',

        location: {
            lat: -13.1631412,
            lng: -72.5449629
        },

        id: 3
    },
    {
        title: 'Chichen Itza',

        location: {
            lat: 20.6842849,
            lng: -88.5677826
        },

        id: 4
    },
    {
        title: 'The Roman Colosseum',

        location: {
            lat: 41.8902102,
            lng: 12.4922309
        },

        id: 5
    },
    {
        title: 'Taj Mahal',

        location: {
            lat: 27.1750151,
            lng: 78.0421552
        },

        id: 6
    },
    {
        title: 'Petra',

        location: {
            lat: 30.3216634,
            lng: 35.480099
        },

        id: 7
    }

];

var animateMarker = function (marker) {
    
    'use strict';

    // Create a Bounce animation.
    if (marker.getAnimation() !== null) {
        // If there is an animation present, clear it
        marker.setAnimation(null);
    } else {

        // If there is no animation present, create a bounce animation
        marker.setAnimation(google.maps.Animation.BOUNCE);

        // Clear the animation after 1.45 seconds
        setTimeout(function () {
            marker.setAnimation(null);
        }, 1450);
    }

};

// This functions adds a link on the infowindow
// This links goes to the wikipedia page of the marker
function getWikipedia (marker, infowindow) {
    
    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&callback=wikiCallback'
    
    $.ajax({
        url: wikiUrl,
        dataType: "jsonp",
        // jsonp: "callback"
        success: function (response) {
            var articleList = response[1][0];
            var url = 'https://en.wikipedia.org/wiki/' + articleList;

            var result = '<a href = "' + url + '">Show ' + articleList + ' on Wikipedia</a>';

            infowindow.setContent(result);
        },

        error: function() {
            var error = '<div>Failed to load Wikipedia link</div>';

            infowindow.setContent(error);
        }
    });
}

var populateInfoWindow = function (marker, infowindow) {
    
    'use strict';
    
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        
        infowindow.marker = marker;
        
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function () {
            infowindow.setMarker = null;
        });

        getWikipedia(marker, infowindow);

        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
};


var addMarker = function (data, bounds, largeInfowindow) {

    'use strict';
    
    var thisNewMarker = this;

    this.bounds = bounds;

    this.largeInfowindow = largeInfowindow;
        
    // Get the position from the data.
    this.position = data.location;
    
    // Get the title from the data.
    this.title = data.title;
    
    // Get the id from the data.
    this.id = data.id;

    // Create a new marker from the data given.
    this.marker = new google.maps.Marker({
        
        map: map,
        position: this.position,
        title: this.title,
        animation: null,
        id: this.id
    });

    // Extend the bounds of the map according to the new marker.
    this.bounds.extend(data.location);
    
    // Create an onclick event.
    this.marker.addListener('click', function () {
        
        animateMarker(this);
        
        // Open an infowindow at each marker
        new populateInfoWindow(this, thisNewMarker.largeInfowindow);
    });
};

var ViewModel = function(map, bounds, largeInfowindow) {
    
    var self = this;

    // Create a new blank array for all the listing markers.
    this.markers = ko.observableArray([]);

    wondersList.forEach(function (newMarker) {
        self.markers.push(new addMarker(newMarker, bounds, largeInfowindow));
    });

    // This functions displays the infowindow once the name of the place is clikced.
    this.showWindow = function (clickedPlace) {
        populateInfoWindow(clickedPlace, largeInfowindow);
        animateMarker(clickedPlace);
    };

    // This function will loop through the markers array and display them all.
    this.showMarkers = function () {
        
        var bounds = new google.maps.LatLngBounds();

        ko.utils.arrayForEach(self.markers(), function (item) {
            item.marker.setMap(map);
            bounds.extend(item.position);
        });
        
        map.fitBounds(bounds);
    };

    // This function will loop through the listings and hide them all.
    this.hideMarkers = function () {

        ko.utils.arrayForEach(self.markers(), function (item) {
            item.marker.setMap(null);
        });
    };

    this.searchQuery = ko.observable('');


    // Store the search results
    this.searchResult = ko.computed(function() {
        var search = self.searchQuery().toLowerCase();
        return ko.utils.arrayFilter(self.markers(), function(item) {
            return item.title.toLowerCase().indexOf(search) >= 0;
        });
    });

    // Filter the data to match the search query
    this.filterMarkers = function() {

        // Clear all the markers from the map
        ko.utils.arrayForEach(self.markers(), function (item) {
            item.marker.setMap(null);
        });

        // Show only the filtered markers
        ko.utils.arrayForEach(self.searchResult(), function (item) {
            item.marker.setMap(map);
            bounds.extend(item.position);
        });
        
    };
};

// Display the map
function initMap() {

    bounds = new google.maps.LatLngBounds();

    largeInfowindow = new google.maps.InfoWindow();

    // Constructor creates a new map.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 35.369568, lng: -6.715259},
        zoom: 4,
        mapTypeControl: false
    });

    // Extend the boundaries of the map for each marker
    map.fitBounds(bounds);

    ko.applyBindings(new ViewModel(map, bounds, largeInfowindow));
}

function errorLoadingMap() {
    document.getElementById('map').innerHTML = "Error Loading the map!";
}
