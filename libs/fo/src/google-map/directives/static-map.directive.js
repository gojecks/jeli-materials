import { GoogleMapService } from "../geo-service";

Directive({
    selector: 'staticMap',
    props: ['size', 'zoom', 'marker', 'url=:staticMap'],
    DI: ['HostElement?']
})
export class StaticMapDirective {
    constructor(hostElement) {
        this.hostElement = hostElement;
        this.size = null;
        this._url = null;
        this.zoom = 18;
        this.marker = true;
    }

    get url(){
        return this._url;
    }

    set url(value){
        if (value) {
            var mapUrl = GoogleMapService.getStaticImgUrl(value, this.size, this.zoom, this.marker);
            this.hostElement.nativeElement.src = mapUrl;
            this._url = value;
        }
    }
}