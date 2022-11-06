import { CommonModule } from '@jeli/common';
import { GoogleMapService } from './geo-service';
import { GoogleMapElement, staticMapDirective } from './google-map/google-map.element';
import { FoPlaceElasticSearchDirective, PlaceElasticSearchElement } from './place-elastic-search/place-elastic-search.element';


jModule({
    requiredModules: [
        CommonModule
    ],
    selectors: [
        GoogleMapElement,
        PlaceElasticSearchElement,
        FoPlaceElasticSearchDirective,
        staticMapDirective
    ],
    services: [
        GoogleMapService
    ]
})
export function GoogleMapModule() {}
GoogleMapModule.setKey = GoogleMapService.setKey;