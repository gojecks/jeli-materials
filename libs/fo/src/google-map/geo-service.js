import { LazyLoader, DOMHelper } from '@jeli/core';
var _mapKey = '';
var GOOGLE_API_URLS = [
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    'https://maps.googleapis.com/maps/api/geocode/json',
    'https://maps.googleapis.com/maps/api/staticmap',
    'https://maps.google.com/maps'
];

var cachedLocations = null;
export var GOOGLE_SERVICE_APIS = {
    PLACES: 0,
    GEOCODE: 1,
    STATIC: 2,
    FRAME: 3
};


/**
 * 
 * @param {*} config 
 */
Service()
export class GoogleMapService {
    constructor() {
        this.configuration = {
            marker: {
                draggable: false,
                bounce: 0
            },
            mapConfig: {
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: false,
                mapTypeId: "roadmap",
                zoom: 13,
            },
            searchBox: null,
            infoBoxTemplate: '<div><strong>{name}</strong><br>{address}',
            ids: {
                autoComplete: "_gpAutoComplete",
                controls: "_gpControls",
                mapCanvas: "_mapCanvas",
                resultPanel: "_resultPanel",
                paginationBtn: "_paginationMoreResult"
            },
            autoComplete: {
                componentRestrictions: { country: "th" },
                fields: ["place_id", "formatted_address", "geometry", "icon", "name", "website"],
                strictBounds: false,
                types: ["establishment"]
            }
        };
        this.placesServiceData = {};
        this.geocoder = null;
        this.map = null;
        this.coordinates = {
            location: { lat: -34.397, lng: 150.644 },
            static: "-34.397,150.644"
        };
        this.browserHasGeolocation = !!navigator.geolocation;
        this.marker = null;
        this.infoWindow = null;
        this.element = {
            get: function (id) {
                return document.getElementById(id);
            },
            buildButtons: function (resource) {
                if (resource.configuration.buttons) {
                    resource.configuration.buttons.forEach(function (obj, idx) {
                        DOMHelper.createElement('button', Object.assign({
                           data: {
                            'ref-idx':idx
                           } 
                        }, obj.attr), obj.text, resource.element.buttonControl);
                    });
                    // attach event listener to the button control
                    resource.events.listener(resource.element.buildControl, 'click', e => {
                        var button = e.target.closest('button');
                        if (button){
                            var config = resource.configuration.buttons[button.dataset.refIdx];
                            if (config && config.action){
                                config.action();
                            }
                        }
                    });
                }
            }
        };
        
        this.events = {
            listener: function (ele, type, fn) {
                ele.addEventListener(type, fn);
            }
        };
    }

    static setKey(key, ignoreLibrary) {
        _mapKey = key;
        if (_mapKey && !ignoreLibrary) {
            LazyLoader.staticLoader(["https://maps.googleapis.com/maps/api/js?key=" + _mapKey + "&libraries=places"], function () {
                console.log("Script loaded");
            }, 'js');
        }
    }
    static getStaticImgUrl(address, size, zoom, setMarker) {
        if (typeof address == 'object')
            address = Object.values(address);
        
        var params = {
            scale: 2,
            center: address,
            zoom: (zoom || 17),
            size: (size || '500x250'),
            markers: setMarker ? address : ''
        };
        return GoogleMapService.constructURL(GOOGLE_SERVICE_APIS.STATIC, params);
    }
    static getCurrentPosition(address, geoCode) {
        return new Promise(function (resolve, reject) {
            function success(latlng) {
                cachedLocations = latlng;
                if (geoCode) {
                    GoogleMapService.geoCodeLocation(latlng)
                        .then(results => {
                            resolve(Object.assign({latlng}, results));
                        }, reject);
                } else {
                    resolve(cachedLocations);
                }
            }

            if (address && address.location) {
                return success({
                    coords: {
                        accuracy: true,
                        latitude: address.location.lat,
                        longitude: address.location.lng
                    }
                });
            }

            if (cachedLocations) {
                var cur = new Date().getMinutes();
                var prev = new Date(cachedLocations.timestamp).getMinutes();
                if (prev > cur) {
                    cur = 60 - cur;
                }
                if (cur > prev && (cur - prev) <= 15) {
                    return resolve(cachedLocations);
                }
            }
            var options = { enableHighAccuracy: true, timeout: 10000 };
            navigator.geolocation.getCurrentPosition(success, reject, options);
        });
    }
    /**
     *
     * @param {*} apiInt
     * @param {*} params
     */
    static constructURL(apiInt, params, ignoreKey) {
        var url = new URL(GOOGLE_API_URLS[apiInt]);
        for (var name in params) {
            url.searchParams.append(name, params[name]);
        }

        if (!ignoreKey) {
            url.searchParams.append('key', _mapKey);
        }

        return url;
    }
    static callApi(urlType, params) {
        var requestURL = GoogleMapService.constructURL(urlType, params);
        return fetch(requestURL.toString()).then(res => res.json());
    }
    static geoCodeLocation(pos) {
        var latlng = pos.coords.latitude + ',' + pos.coords.longitude;
        return GoogleMapService.callApi(GOOGLE_SERVICE_APIS.GEOCODE, {
            latlng,
            sensor: true
        });
    }
    static getPlacesNearBy(params) {
        return GoogleMapService.callApi(GOOGLE_SERVICE_APIS.PLACES, params);
    }
    static watchPosition(options, success, error) {
        options = options || {};
        options.timeout = options.timeout || 3000;
        var watchID = navigator.geolocation.watchPosition(success, error, options);
        return function () {
            navigator.geolocation.clearWatch(watchID);
        };
    }
    startGeoPlaces(startAddress) {
        return new Promise((resolve, reject) => {
            var container = this.element.get(this.configuration.ids.mapCanvas);
            if (!container || !window.google) { return reject('Google maps not available or unable to locate map canvas'); }
            var mapConfig = Object.assign({ center: (startAddress || this.coordinates).location }, this.configuration.mapConfig);

            this.geocoder = new google.maps.Geocoder;
            this.map = new google.maps.Map(container, mapConfig);
            //set infoWindow
            this.infoWindow = new google.maps.InfoWindow();
            //set Marker
            this.marker = new google.maps.Marker({
                map: this.map,
                anchor: new google.maps.Point(0, -29),
                position: mapConfig.center,
                draggable: this.configuration.marker.draggable,
                animation: this.configuration.marker.bounce
            });

            // attach listener
            if (this.configuration.marker.bounce) {
                this.marker.addListener('click', () => {
                    if (this.marker.getAnimation() !== null) {
                        this.marker.setAnimation(null);
                    } else {
                        this.marker.setAnimation(google.maps.Animation.BOUNCE);
                    }
                });
            }

            resolve(true);
        });
    }
    draggableMarker(callback) {
        if (this.configuration.marker.draggable) {
            this.marker.addListener('dragend', (e) => {
                this._updateCoordinates(e.latLng);
                this.geocodeLocation({ 'location': e.latLng }, callback);
            });
        }

        return this;
    }
    setConfiguration(config) {
        for (var prop in config) {
            if (!this.configuration[prop]) {
                this.configuration[prop] = config[prop];
            } else if (typeof this.configuration[prop] === 'object') {
                if (!config[prop]) {
                    this.configuration[prop] = config[prop];
                } else {
                    Object.assign(this.configuration[prop], config[prop]);
                }
            } else {
                this.configuration[prop] = config[prop];
            }
        }
        return this;
    }
    setCoordinates(pos) {
        this.coordinates = {
            pos: pos,
            location: ({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            }),
            static: pos.coords.latitude + ',' + pos.coords.longitude,
            bounds: {
                north: pos.coords.latitude + 0.1,
                south: pos.coords.latitude - 0.1,
                east: pos.coords.longitude + 0.1,
                west: pos.coords.longitude - 0.1,
            }
        };

        return this;
    }
    /**
     * Build AutoComplete
     * @param {*} callback
     * @param {*} element
     * @returns
     */
    buildAutoComplete(callback, input) {
        if (this.configuration.searchBox) {
            input = input || this.element.get(this.configuration.ids.autoComplete);
            if (input) {
                this.autocomplete = new google.maps.places.Autocomplete(input, this.configuration.autoComplete);
                if (this.map) {
                    this.autocomplete.setBounds(this.coordinates.bounds);
                    this.autocomplete.bindTo('bounds', this.map);
                    this.element.AutoComplete = input;
                }

                if (callback) {
                    this.autocomplete.addListener('place_changed', e => {
                        var place = this.autocomplete.getPlace();
                        callback.call(this, JSON.parse(JSON.stringify(place)));
                        place = null;
                    });
                }
            }
        }

        return this;
    }
    buildControls() {
        if (this.configuration.searchBox) {
            this.element.buttonControl = this.element.get(this.configuration.ids.controls);
            if (this.element.buttonControl) {
                this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.element.buttonControl);
                this.element.buildButtons(this);
            }
        }

        return this;
    }
    bindResultPanel(callback) {
        var resultPanel = this.element.get(this.configuration.ids.resultPanel);
        if (resultPanel) {
            this.events.listener(resultPanel, 'click', callback);
            this.events.listener(resultPanel, 'scroll', () => {
                if (this.nearbyPlacesPagination) {
                    var currentScrollHeight = (resultPanel.scrollTop + resultPanel.offsetHeight);
                    if (currentScrollHeight === resultPanel.scrollHeight) {
                        this.nearbyPlacesPagination.nextPage();
                    }
                }
            });
        }

        return this;
    }
    getPlaceInfo(id) {
        return this.placesServiceData[id];
    }
    _updateCoordinates(location) {
        this.coordinates.location = location;
        this.coordinates.static = Object.values(location).join(',');
    }
    selectedPlace(place) {
        this._updateCoordinates(place.geometry.location);
        if (this.element.AutoComplete) {
            this.element.AutoComplete.value = place.name || place.formatted_address;
        }
    }
    addMarkerToMap(place) {
        var image = {
            url: place.icon || '',
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
        };

        var marker = new google.maps.Marker({
            icon: image,
            title: place.name,
            position: place.geometry.location
        });
        marker.setMap(this.map);
    }
    /**
     *
     * @param {*} places
     * @param {*} pagination
     * @returns
     */
    updateResultPanel(places, pagination, addMarkers) {
        var bounds = new google.maps.LatLngBounds();
        var placesList = this.element.get(this.configuration.ids.resultPanel);
        // add pagination to placeList object
        this.nearbyPlacesPagination = pagination;
        // empty the view
        placesList.innerHTML = '';
        for (var i = 0, place; place = places[i]; i++) {
            if (addMarkers) {
                this.addMarkerToMap(place);
            }
            //store data for reference
            this.placesServiceData[place.place_id] = place;
            if (placesList) {
                DOMHelper.createElement('li', {
                    'id': place.place_id,
                    'title': place.name
                }, place.name, placesList);
            }

            bounds.extend(place.geometry.location);
        }

        // fitBounds will reduce zoom size
        // https://developers.google.com/maps/documentation/javascript/reference/map#Map.fitBounds
        if (addMarkers) {
            this.map.fitBounds(bounds);
        }

        return this;
    }
    //Build Info Box
    updateMarker(place) {
        this.infoWindow.close();
        this.marker.setVisible(false);
        var place = place;
        if (!place.geometry) {
            alert("Autocomplete's returned place contains no geometry");
            return;
        }
        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            this.map.fitBounds(place.geometry.viewport);
        } else {
            this.map.setCenter(place.geometry.location);
            this.map.setZoom(17); // Why 17? Because it looks good.
        }

        /** @type {google.maps.Icon} */
        this.marker.setIcon({
            url: place.icon || '',
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(35, 35)
        });

        this.marker.setPosition(place.geometry.location);
        this.marker.setVisible(true);
        return this;
    }
    /**
     *
     * @param {*} place
     * @param {*} replacer
     * @param {*} setMarker
     */
    setMapInfoWindowContent(place, replacer, setMarker) {
        if (this.configuration.showInfoWindow) {
            var address = '';
            if (place.address_components) {
                address = [
                    (place.address_components[0] && place.address_components[0].short_name || ''),
                    (place.address_components[1] && place.address_components[1].short_name || ''),
                    (place.address_components[2] && place.address_components[2].short_name || '')
                ].join(' ');
            }

            replacer = replacer ? replacer : ({ "{name}": (place.name || ''), "{address}": address });
            var message = this.templateCompiler(this.configuration.infoBoxTemplate, replacer);
            this.infoWindow.setPosition(this.coordinates.location);
            this.infoWindow.setContent(message);
            this.infoWindow.open(this.map, setMarker ? this.marker : null);
        }

        return this;
    }
    templateCompiler(template, obj) {
        for (var i in obj) {
            template = template.replace(i, obj[i]);
        }

        return template;
    }
    geocodeLocation(param, callback, type) {
        if (this.geocoder) {
            this.geocoder.geocode(param, (results, status) => {
                if (status == google.maps.GeocoderStatus.OK) {
                    type = type || 'street_address';
                    var place = results.find(place => place.types.includes(type));
                    callback(place);
                }
            });
        } else {
            callback(null);
        }

        return this;
    }
    setPosition(callback, type) {
        this.geocodeLocation({ 'location': this.coordinates.location }, callback, type);
        this.map.setZoom(17);
        this.map.setCenter(this.coordinates.location);

        return this;
    }
    startGoogleMap(container) {
        this.map = new GMap2(container);
        this.map.setCenter(new GLatLng(34, 0), 1);
        this.geocoder = new GClientGeocoder();

        return this;
    }
    reDrawLocation(onSuccess, onError) {
        var self = this;
        self.geocoder.getLocations(self.coordinates.location, function (options) {
            self.map.clearOverlays();
            if (!options || options.Status.code != 200) {
                onError("We are unable to geocode the location");
            } else {
                var place = options.Placemark[0];
                var point = new GLatLng(place.Point.coordinates[1], place.Point.coordinates[0]);
                var marker = new GMarker(point);
                self.map.setCenter(point, 13);
                self.map.addOverlay(marker);

                onSuccess(place);
            }
        });
    }
    init(address) {
        return GoogleMapService.getCurrentPosition(address);
    }
    destroy() {
        this.placesServiceData = null;
        this.geocoder = null;
        this.map = null;
        this.marker = null;
        this.infoWindow = null;
    }

    getPlacesNearBy(query) {
        var service = new google.maps.places.PlacesService(this.map);
        return new Promise((resolve, reject) => {
            service.nearbySearch({
                location: this.coordinates.location,
                radius: this.configuration.nearbyPlaces.radius,
                type: [query]
            }, (results, status, pagination) => {
                if (status !== google.maps.places.PlacesServiceStatus.OK) {
                    return reject();
                }
    
                resolve({ results: results, pagination: pagination });
            });
        });
    }
}