import { GoogleMapService } from "../geo-service";
import { EventEmitter, AttributeAppender } from '@jeli/core';

Element({
    selector: 'fo-google-map',
    templateUrl: './google-map.element.html',
    styleUrl: './google-map.element.scss',
    props: ['config', 'address', 'readOnly'],
    events: ['onPlaceSelected:emitter']
})
export function GoogleMapElement() {
    this.geoService = new GoogleMapService();
    this.onPlaceSelected = new EventEmitter();
    this.address = null;
    this.readOnly = false;
    this.showResult = false;
    this._config = {
        showInfoWindow: false,
        searchBox: {
            placeHolder: "Search a location..",
            styles: {}
        },
        nearbyPlaces: {
            title: "Nearby",
            options: ['store', 'hospital', 'bank', 'park', 'school', 'restuarant'],
            radius: 500
        },
        styles: {
            height: "20vh"
        }
    };

    Object.defineProperty(this, 'config', {
        set: function(value) {
            Object.assign(this._config, value);
            this.geoService.setConfiguration(this._config);
        }
    });
}

GoogleMapElement.prototype.viewDidLoad = function() {
    this.geoService.startGeoPlaces(this.address)
        .buildAutoComplete((place) => this._onPlaceSelected(place, true))
        .buildControls()
        .bindResultPanel((e) => {
            var id = e.target.getAttribute('id');
            var place = this.geoService.getPlaceInfo(id);
            this._onPlaceSelected(place, true);
        })
        .draggableMarker(place => {
            this._onPlaceSelected(place, true);
        })
        .init(this.address)
        .then((pos) => {
            if (pos.coords.accuracy) {
                this.geoService.setCoordinates(pos)
                    .setPosition(place => {
                        if (place && !this.address) {
                            this._onPlaceSelected(place, false);
                        }
                    });
                // load nearbyPlaces
                if (this._config.nearbyPlaces) {
                    this.getPlacesNearBy(this._config.nearbyPlaces.options[0]);
                }
            }
        })
        .catch(() => {
            if (this.geoService.infoWindow) {
                this.geoService.infoWindow.setPosition(this.geoService.coordinates.location);
                this.geoService.infoWindow.setContent(this.geoService.browserHasGeolocation ?
                    'Error: The Geolocation service failed.' :
                    'Error: Your browser doesn\'t support geolocation.');
            }
        });
};

GoogleMapElement.prototype._onPlaceSelected = function(place, emitEvent) {
    this.geoService
        .updateMarker(place)
        .setMapInfoWindowContent(place, null, true)
        .selectedPlace(place);
    if (emitEvent) {
        this.onPlaceSelected.emit(place);
    }
}

GoogleMapElement.prototype.getPlacesNearBy = function(value) {
    this.geoService.getPlacesNearBy(value)
        .then(response => this.geoService.updateResultPanel(response.results, response.pagination));
}

GoogleMapElement.prototype.viewDidDestroy = function() {
    this.geoService.destroy();
}

Directive({
    selector: 'staticMap',
    props: ['size', 'url=:staticMap'],
    DI: ['ElementRef?']
})
export function staticMapDirective(elementRef) {
    this.size = null;
    this._url = null;
    Object.defineProperty(this, 'url', {
        set: function(value) {
            if (value) {
                var mapUrl = GoogleMapService.getStaticImgUrl(value, this.size, 18, true);
                AttributeAppender.setProp(elementRef.nativeElement, 'src', mapUrl);
                this._url = value;
            }
        },
        get: function() {
            return this._url;
        }
    });
}