import { GoogleMapService } from "../geo-service";
import { EventEmitter } from '@jeli/core';

Element({
    selector: 'fo-google-map',
    templateUrl: './google-map.element.html',
    styleUrl: './google-map.element.scss',
    props: ['config', 'address', 'readOnly', 'emitCurrentLocation'],
    events: ['onPlaceSelected:emitter']
})
export class GoogleMapElement {
    constructor() {
        this.geoService = new GoogleMapService();
        this.onPlaceSelected = new EventEmitter();
        this.actions = ['map', 'places'];
        this.selectedAction = '';
        this.address = null;
        this.readOnly = false;
        this.showResult = false;
        this.error = false;
        this.emitCurrentLocation = false;
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
    }

    set config(value){
        Object.assign(this._config, value);
        this.geoService.setConfiguration(this._config);
    }

    get config(){
        return this._config;
    }

    viewDidLoad() {
        this.geoService.startGeoPlaces(this.address)
            .then(() => {
                this.geoService
                    .buildControls()
                    .buildAutoComplete((place) => this._onPlaceSelected(place, true))
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
                                    if (!place) return;
                                    if (!this.address) {
                                        this._onPlaceSelected(place, this.emitCurrentLocation);
                                    } else if (this._config.showInfoWindow) {
                                        this.geoService.setMapInfoWindowContent(place, null, true);
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
            }, (err) => {
                console.error(err);
                this.error = true;
            });

    }
    _onPlaceSelected(place, emitEvent) {
        this.geoService
            .updateMarker(place)
            .setMapInfoWindowContent(place, null, true)
            .selectedPlace(place);
        if (emitEvent) {
            this.onPlaceSelected.emit(place);
        }
    }
    getPlacesNearBy(value) {
        this.geoService.getPlacesNearBy(value)
            .then(response => this.geoService.updateResultPanel(response.results, response.pagination))
            .catch(err => console.log(err));
    }
    viewDidDestroy() {
        this.geoService.destroy();
    }
}