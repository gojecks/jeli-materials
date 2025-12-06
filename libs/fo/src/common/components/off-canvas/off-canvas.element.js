import { EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-off-canvas',
    templateUrl: './off-canvas.element.html',
    styleUrl: './off-canvas.element.scss',
    props: [
        'hideTrigger',
        'backDrop', 
        'btnStyle', 
        'btnText', 
        'iconClass', 
        'backDropClose', 
        'id', 
        'title', 
        'position',
        'isOpen'
    ],
    events: ['onCanvasAction:emitter']
})
export class OffCanvasElement {
    hideTrigger = false;
    _isOpen = false;
    constructor() {
        this.backDrop = true;
        this.btnStyle = 'btn-primary';
        this.btnText = 'Open';
        this.iconClass = '';
        this.backDropClose = false;
        this.id = 'offCanvas-' + (+new Date);
        this.title = 'Off canvas';
        this.position = 'start';
        this.onCanvasAction = new EventEmitter(false);
    }

    set isOpen(value){
        this._isOpen = value;
    }

    offCanvasAction(state, fromBackdrop) {
        if (fromBackdrop && !this.backDropClose) return;
        this._isOpen = state;
        this.onCanvasAction.emit(state);
    }
}

