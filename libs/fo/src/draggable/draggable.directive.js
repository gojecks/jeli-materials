Directive({
    selector: "foDraggable",
    events: [
        "mousedown:event=onActivate($event)",
        "mousemove:event=onMove($event)",
        "mouseup:event=onDeactivate($event)",
        "foDraggableChange:emitter"
    ]
})
export class DragableDirective {
    constructor() {
        this.dragEnabled = false;
        this.points = { sx: 0, sy: 0, mx: 0, my: 0 };
        this.foDraggableChange = new EventEmitter();
    }
    onActivate(ev) {
        ev.preventDefault();
        this.dragEnabled = true;
        this.points.sx = ev.clientX;
        this.points.sy = ev.clientY;
    }
    onMove(ev) {
        if (this.dragEnabled) {
            this.points.mx = (this.points.sx - ev.clientX);
            this.points.my = (this.points.sy - ev.clientY);
            this.points.sx = ev.clientX;
            this.points.sy = ev.clientY;
            // set the element's new position:
            this.calculatePos(ev);
            AttributeAppender.setProp(ev.target, 'style', this.points.currentState);
        }
    }
    onDeactivate(ev) {
        this.dragEnabled = false;
        this.foDraggableChange.emit(this.points);
    }
    calculatePos(ev) {
        this.points.currentState = {
            top: (ev.target.offsetTop - this.points.my),
            left: (ev.target.offsetLeft - this.points.mx),
            height: ev.target.offsetHeight,
            width: ev.target.offsetWidth
        };
    }
}




