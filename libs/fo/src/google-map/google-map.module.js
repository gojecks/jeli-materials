import { CommonModule } from '@jeli/common';
import { GoogleMapService } from './geo-service';
import { GoogleMapElement } from './google-map/google-map.element';
import { 
    FoPlaceElasticSearchDirective, 
    PlaceElasticSearchElement, 
    PlaceElasticSearchV2Element 
} from './place-elastic-search/place-elastic-search.element';
import { NearbyPlacesElement } from './nearby-places/nearby-places.element';
import { StaticMapDirective } from './directives/static-map.directive';
import { GoogleMapsIframeDirective } from './directives/frame-map.directive';
import { GoogleMarkersElement } from './google-markers/google-markers.element';


jModule({
    requiredModules: [
        CommonModule
    ],
    selectors: [
        GoogleMapElement,
        PlaceElasticSearchElement,
        FoPlaceElasticSearchDirective,
        StaticMapDirective,
        NearbyPlacesElement,
        GoogleMapsIframeDirective,
        PlaceElasticSearchV2Element,
        GoogleMarkersElement
    ],
    services: [
        GoogleMapService
    ]
})
export function GoogleMapModule() {}
GoogleMapModule.setKey = GoogleMapService.setKey;