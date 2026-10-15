import { EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-alert',
    templateUrl: './fo-alert.element.html',
    styleUrl: './fo-alert.element.scss',
    props: ['type', 'dismissable', 'text', 'iconClass'],
    events: ['onAlertClose:emitter']
})
export class FoAlertElement {
    constructor() {
        this.dismissable = false;
        this.type = 'danger';
        this.text = '';
        this.onAlertClose = new EventEmitter();
    }
    
    closeAlert() {
        this.onAlertClose.emit(true);
    }
}

