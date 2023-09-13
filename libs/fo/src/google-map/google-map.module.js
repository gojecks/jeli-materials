import { CommonModule } from '@jeli/common';
import { GoogleMapService } from './geo-service';
import { GoogleMapElement, staticMapDirective } from './google-map/google-map.element';
import { FoPlaceElasticSearchDirective, PlaceElasticSearchElement } from './place-elastic-search/place-elastic-search.element';
import { NearbyPlacesElement } from './nearby-places/nearby-places.element';


jModule({
    requiredModules: [
        CommonModule
    ],
    selectors: [
        GoogleMapElement,
        PlaceElasticSearchElement,
        FoPlaceElasticSearchDirective,
        staticMapDirective,
        NearbyPlacesElement
    ],
    services: [
        GoogleMapService
    ]
})
export function GoogleMapModule() {}
GoogleMapModule.setKey = GoogleMapService.setKey;