import {EventEmitter} from '@jeli/core';

Directive({
    selector: 'fileUploadDrag',
    events: [
        'drag dragstart dragend dragover dragenter dragleave drop:event=fileUploadDragChange.emit($event)',
        'fileUploadDragChange:emitter'
    ]
})
export function FileUploadDragDirective(){
    this.fileUploadDragChange = new EventEmitter();
}