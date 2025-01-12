import { GoogleMapService } from "../geo-service";

Element({
    selector: 'fo-map-nearby-places',
    templateUrl: './nearby-places.element.html',
    styleUrl: './nearby-places.element.scss',
    props: ['title', 'types', 'placeholder', 'radius', 'location', 'initCoordinates']
})
export class NearbyPlacesElement {
    constructor() {
        this.types = [];
        this.title = 'Nearby Places';
        this.placeHolder = 'Type to search...';
        this.initCoordinates = false;
        this.radius = 1500;
    }
    didInit() {
        if (this.initCoordinates) {
            GoogleMapService.getCurrentPosition()
                .then(value => {
                    this.location = value.latlng;
                });
        }
    }
    getPlacesNearBy(type) {
        // perform request
        GoogleMapService.getPlacesNearBy({
            location: encodeURIComponent(this.location),
            'radius': this.radius,
            type
        })
            .then(value => console.log(value));
    }
}