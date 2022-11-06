import { EventEmitter } from '@jeli/core';
import { GoogleMapService } from '../geo-service';

Element({
    selector: 'fo-place-elastic-search',
    templateUrl: './place-elastic-search.element.html',
    styleUrl: './place-elastic-search.element.scss',
    events: ['onPlaceSelected:emitter'],
    props: ['options'],
    DI: [GoogleMapService, 'changeDetector?']
})
export function PlaceElasticSearchElement(googleMapService, changeDetector) {
    this.onPlaceSelected = new EventEmitter();
    this.googleMapService = googleMapService;
    this.changeDetector = changeDetector;
    this.homeLocations = [];
    this._options = {
        ids: {
            autoComplete: "_gpAutoComplete"
        },
        searchBox: true
    };
    this.autoCompleteInstance = null;
    Object.defineProperty(this, 'options', {
        set: function(value) {
            if (value && typeof value === 'object') {
                Object.assign(this._options, value);
            }
        }
    });
}

PlaceElasticSearchElement.prototype.didInit = function() {
    this.googleMapService
        .setConfiguration(this._options)
        .init()
        .then(pos => this.googleMapService.setCoordinates(pos));
}

PlaceElasticSearchElement.prototype.viewDidLoad = function() {
    this.googleMapService.buildAutoComplete(place => this.onPlaceSelected.emit(place));
};

PlaceElasticSearchElement.prototype.viewDidDestroy = function() {
    var googlePacContainer = document.querySelector('.pac-container');
    if (googlePacContainer) {
        document.body.removeChild(googlePacContainer);
    }
}

Directive({
    selector: 'foPlaceElasticSearch',
    events: ['onPlaceSelected:emitter'],
    props: ['options'],
    DI: [GoogleMapService, 'changeDetector?', 'ElementRef?']
})
export function FoPlaceElasticSearchDirective(googleMapService, changeDetector, elementRef) {
    PlaceElasticSearchElement.call(this, googleMapService, changeDetector);
    this.Element = elementRef;
}
FoPlaceElasticSearchDirective.constructor = PlaceElasticSearchElement;
FoPlaceElasticSearchDirective.prototype = Object.create(PlaceElasticSearchElement.prototype);
FoPlaceElasticSearchDirective.prototype.viewDidLoad = function() {
    this.googleMapService.buildAutoComplete(place => {
        this.onPlaceSelected.emit(place);
    }, this.Element.nativeElement);
};