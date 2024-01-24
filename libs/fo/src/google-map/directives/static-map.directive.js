import { GoogleMapService } from "../geo-service";

Directive({
    selector: 'staticMap',
    props: ['size', 'url=:staticMap'],
    DI: ['HostElement?']
})
export function StaticMapDirective(hostElement) {
    this.size = null;
    this._url = null;
    Object.defineProperty(this, 'url', {
        set: function (value) {
            if (value) {
                var mapUrl = GoogleMapService.getStaticImgUrl(value, this.size, 18, true);
                hostElement.nativeElement.src = mapUrl;
                this._url = value;
            }
        },
        get: function () {
            return this._url;
        }
    });
}