import { EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-alert',
    templateUrl: './fo-alert.element.html',
    styleUrl: './fo-alert.element.scss',
    props: ['type', 'dismissable', 'text', 'iconClass'],
    events: ['onAlertClose:emitter']
})
export function FoAlertElement() {
    this.dismissable = false;
    this.type = 'danger';
    this.text = '';
    this.onAlertClose = new EventEmitter();
}

FoAlertElement.prototype.closeAlert = function() {
    this.onAlertClose.emit(true);
}