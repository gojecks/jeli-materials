import { GoogleMapService } from "../geo-service";
import { DOMHelper } from '@jeli/core';

Directive({
    selector: 'googleMapsIframe',
    props: ['location=:googleMapsIframe', 'zoom', 'kind'],
    DI: ['HostElement?']
})
export function GoogleMapsIframeDirective(hostElement){
    this.location = null;
    this.hostElement = hostElement;
}

GoogleMapsIframeDirective.prototype.didInit = function(){
    var url = GoogleMapService.constructURL(GoogleMapService.APIS.FRAME, {
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
    }, null, this.hostElement.nativeElement)
}