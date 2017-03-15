'use strict';
//Error message function to let user know whats going on
function errorMessage() {
    alert("Please check your internet connection. Error loading Google Maps API Data.");
}
//Make the phone number returned from FourSquare human readable https://goo.gl/R36JNm
function normalizePhone(phone) {
	//normalize string and remove all unnecessary characters
    phone = phone.replace(/[^\d]/g, "");
    //check if number length equals to 10
    if (phone.length == 10) {
        //reformat and return phone number
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    }
    return null;
}

//address to loc http://www.latlong.net/convert-address-to-lat-long.html
var locationsList = [{
        name: 'Space Launch Complex 40',
        lat: 28.562089,
        long: -80.577228
    },
    {
        name: 'Cape Canaveral',
        lat: 28.392218,
        long: -80.607713
    },
    {
        name: 'Launch Pad 39 Observation Gantry',
        lat: 28.595595703670654,
        long: -80.61813534164534
    },
    {
        name: 'Launch Control Center',
        lat: 28.572872,
        long: -80.6489811
    },
    {
        name: 'Kennedy Space Center Visitor Center',
        lat: 28.5275863,
        long: -80.770367
    },
    {
        name: 'Space Launch Complex 17',
        lat: 28.44649712478761,
        long: -80.56765765809048
    },
];

//Strict mode local variables
var map, markerBounds;

var Location = function(data) {
    var self = this;

    this.name = data.name;
    this.lat = data.lat;
    this.long = data.long;
    this.URL = "";
    this.street = "";
    this.city = "";
    this.phone = "";
    this.twitter = "";

    this.visible = ko.observable(true);

    var foursquareAPI = 'https://api.foursquare.com/v2/venues/search?ll=' + this.lat + ',' + this.long + '&client_id=M4KRP1BJ3VDK2NWAR50BC53U3W5ASGNHMTHFISK0YOI0TBYV&client_secret=ACSUTULZ4DRRHLJWR0GGCDNMO2WFJOJNWRGMG30V2X4FVFAS&v=20160118&query=' + this.name;

	//Get FourSquare data and format it
    $.getJSON(foursquareAPI).done(function(data) {
        var results = data.response.venues[0];
        self.URL = results.url;
        if (typeof self.URL === 'undefined') {
            self.URL = '';
        }
        self.street = results.location.formattedAddress[0];
        self.city = results.location.formattedAddress[1];
		self.phone = results.contact.phone;
        if (typeof self.phone === 'undefined') {
            self.phone = '';
        }
		else{
			self.phone = normalizePhone(self.phone);
		}
        self.twitter = results.contact.twitter;
        if (typeof self.twitter === 'undefined') {
            self.twitter = '';
        } else {
            self.twitter = '@' + self.twitter;
        }   
    //Inform the user of a foursquare issue
    }).fail(function() {
        alert("Please Reload the Page. Error loading FourSquare Data");
    });

    //Make the info window
    this.infoWindow = new google.maps.InfoWindow({
        content: self.contentString
    });

    //Format the markers for Google
    var pos = new google.maps.LatLng(data.lat, data.long);

    //Make the markers on the map
    this.marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: data.name
    });

    //Make the map size as big as the locations in it
    markerBounds.extend(pos);

	//Show marker if visible during search
    this.showMarker = ko.computed(function() {
        if (this.visible() === true) {
            this.marker.setMap(map);
        } else {
            this.marker.setMap(null);
        }
        return true;
    }, this);

    //Show the info when you click on a marker
    this.marker.addListener('click', function() {

        self.contentString = '<div class="info-window-content"><b>' + data.name + "</b></div>" +
            '<div class="content"><a href="' + self.URL + '">' + self.URL + "</a></div>" +
            '<div class="content">' + self.street + "</div>" +
            '<div class="content">' + self.city + "</div>" +
            '<div class="content"><a href="https://twitter.com/' + self.twitter + '">' + self.twitter + "</div>" +
            '<div class="content"><a href="tel:' + self.phone + '">' + self.phone + "</a></div></div>";

        //Add the above html to the popup window
        self.infoWindow.setContent(self.contentString);

        //Move map to clicked position
        map.panTo(self.marker.getPosition());

        //Open the info window on the map
        self.infoWindow.open(map, this);

        //Make the locations bounce for 1.9 seconds
        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            self.marker.setAnimation(null);
        }, 1900);

    });
    //Make the locations bounce
    this.bounce = function(place) {
        google.maps.event.trigger(self.marker, 'click');
    };

    //Event that closes the Info Window with a click on the map
    google.maps.event.addListener(map, 'click', function() {
        self.infoWindow.close(map, this);
    });


};

function AppViewModel() {
    var self = this;

    this.searchTerm = ko.observable("");

    this.locationList = ko.observableArray([]);
    // Make the map to view
    map = new google.maps.Map(document.getElementById('map'), {});

    //Get the limits of the map
    markerBounds = new google.maps.LatLngBounds();

    locationsList.forEach(function(locationItem) {
        self.locationList.push(new Location(locationItem));
    });


    // Start map at center https://goo.gl/qLGnAJ
    map.fitBounds(markerBounds);

    // Search function for searching though the lists on the map
    this.filteredList = ko.computed(function() {
        var filter = self.searchTerm().toLowerCase();
        if (!filter) {
            self.locationList().forEach(function(locationItem) {
                locationItem.visible(true);
            });
            return self.locationList();
        } else {
            return ko.utils.arrayFilter(self.locationList(), function(locationItem) {
                var string = locationItem.name.toLowerCase();
                var result = (string.search(filter) >= 0);
                locationItem.visible(result);
                return result;
            });
        }
    }, self);
}

function startApp() {
    ko.applyBindings(new AppViewModel());
}