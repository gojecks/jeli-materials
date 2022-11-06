import { EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-off-canvas',
    templateUrl: './off-canvas.element.html',
    styleUrl: './off-canvas.element.scss',
    props: ['backDrop', 'btnStyle', 'btnText', 'iconClass', 'backDropClose', 'id', 'title', 'position'],
    events: ['onCanvasAction:emitter']
})
export function OffCanvasElement() {
    this.backDrop = true;
    this.btnStyle = 'btn-primary';
    this.btnText = 'Open';
    this.iconClass = '';
    this.backDropClose = true;
    this.id = 'offCanvas-' + (+new Date);
    this.isOpen = false;
    this.title = 'Off canvas';
    this.position = 'start';
    this.onCanvasAction = new EventEmitter(false);
}

OffCanvasElement.prototype.offCanvasAction = function(state, fromBackdrop) {
    if (fromBackdrop && !this.backDropClose) return;
    this.isOpen = state;
    this.onCanvasAction.emit(state);
}