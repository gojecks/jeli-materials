import { AttributeAppender, EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-draggable',
    templateUrl: './draggable.element.html',
    styleUrl: './draggable.element.scss',
    events: [
        "mousedown:event=onActivate($event)",
        "mousemove:event=onMove($event)",
        "mouseup:event=onDeactivate($event)",
        "dragableChange:emitter"
    ]
})
export function DraggableElement() {
    this.dragEnabled = false;
    this.startPoint = 0;
    this.previousState = { top: 0, left: 0 };
    this.dragableChange = new EventEmitter();
}

DraggableElement.prototype.onActivate = function(ev) {
    this.dragEnabled = true;
    this.startPoint = ev.pageY;
};

DraggableElement.prototype.onMove = function(ev) {
    if (this.dragEnabled) {
        var pos = this.calculatePos(ev);
        AttributeAppender.setProp(ev.target, 'style', pos);
    }
};

DraggableElement.prototype.onDeactivate = function(ev) {
    this.dragEnabled = false;
    Object.assign(this.previousState, this.calculatePos(ev));
    this.dragableChange.emit(this.previousState);
}

DraggableElement.prototype.calculatePos = function(ev) {
    var obj = ev.target;
    return {
        top: (this.previousState.top + (ev.pageY - this.startPoint))
    };
};