import { GoogleMapService } from "../geo-service";

Element({
    selector: 'fo-map-nearby-places',
    templateUrl: './nearby-places.element.html',
    styleUrl: './nearby-places.element.scss',
    props: ['title', 'types', 'placeholder', 'radius', 'location', 'initCoordinates']
})
export function NearbyPlacesElement() {
    this.types = [];
    this.title = 'Nearby Places';
    this.placeHolder = 'Type to search...';
    this.initCoordinates = false;
    this.radius = 1500;
}

NearbyPlacesElement.prototype.didInit = function(){
    if (this.initCoordinates){
        GoogleMapService.getCurrentPosition()
        .then(value => {
            console.log(value);
            this.location = value.latlng;
        });
    }
}

NearbyPlacesElement.prototype.getPlacesNearBy = function (type) {
    var query = "location=" + encodeURIComponent(this.location);
    query += "&radius=" + this.radius;
    query += "&type=" + type;
    query += "key=" + _mapKey;
    // perform request
    fetch('https://maps.googleapis.com/maps/api/place/nearbysearch/json?' + query)
    .then(res => res.json())
    .then(value => console.log(value));
}