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
export function InfoIconElement(hostElement) {
    this.config = {
        text:'My info icon text',
        display:'popover',
        title:'PopOver Title',
        position:'right'
    };
    this.infoIconElement = null;
    this.popoverService = new PopOverService(hostElement.nativeElement);
}

InfoIconElement.prototype.didInit = function(){
    this.popoverService.create(this.config);
}

InfoIconElement.prototype.onWindowResize = function(){
   if (this.popoverService.isVisible){
        this.popoverService.determinePosition()
   }
}

InfoIconElement.prototype.viewDidDestroy = function(){
    this.popoverService.destroy();
}