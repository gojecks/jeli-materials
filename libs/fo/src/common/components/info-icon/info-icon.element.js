import { PopOverService } from "./popover.service";

Directive({
    selector: 'foInfoIcon',
    styleUrl: './info-icon.element.scss',
    events: [
        'window.resize:event=onWindowResize()'
    ],
    props: ['config=:foInfoIcon'],
    DI: ['HostElement?']
})
export class InfoIconElement {
    constructor(hostElement) {
        this.config = {
            text: 'My info icon text',
            display: 'popover',
            title: 'PopOver Title',
            position: 'right'
        };
        this.infoIconElement = null;
        this.popoverService = new PopOverService(hostElement.nativeElement);
    }
    didInit() {
        this.popoverService.create(this.config);
    }
    onWindowResize() {
        if (this.popoverService.isVisible) {
            this.popoverService.determinePosition();
        }
    }
    viewDidDestroy() {
        this.popoverService.destroy();
    }
}



