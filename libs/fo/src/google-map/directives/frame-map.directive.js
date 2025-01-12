import { GoogleMapService, GOOGLE_SERVICE_APIS } from "../geo-service";
import { DOMHelper } from '@jeli/core';

Directive({
    selector: 'googleMapsIframe',
    props: ['location=:googleMapsIframe', 'zoom', 'kind'],
    DI: ['HostElement?']
})
export class GoogleMapsIframeDirective {
    constructor(hostElement) {
        this.location = null;
        this.hostElement = hostElement;
    }
    didInit() {
        var url = GoogleMapService.constructURL(GOOGLE_SERVICE_APIS.FRAME, {
            q: this.location,
            z: this.zoom || 12,
            t: this.kind || 'm',
            output: 'embed'
        }, true);

        DOMHelper.createElement('iframe', {
            src: url.toString(),
            loading: "lazy",
            referrerpolicy: "no-referrer-when-downgrade",
            class: 'w-100 h-100',
            title: this.location,
            ariaLabel: this.location
        }, null, this.hostElement.nativeElement);
    }
}

