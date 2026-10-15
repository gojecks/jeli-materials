import {EventEmitter, rxTimeout} from '@jeli/core';
Directive({
    selector: 'longPress',
    props: ['timeout'],
    events: ['mousedown mouseup:event=handleEvent($event)', 'longPressChange:emitter']
})
export class LongPressDirective {
    constructor() {
        this.timeout = 1500;
        this.timerId = new rxTimeout();
        this.longPressChange = new EventEmitter();
    }
    didInit() {
        this.timerId.subscribe(() => this.longPressChange.emit({ type: 'longPress' }));
    }
    handleEvent(event) {
        if (event.type == 'mousedown') {
            this.timerId.play(this.timeout);
        } else if (event.type == 'mouseup') {
            this.timerId.stop();
        }
    }
    viewDidDestroy() {
        this.timerId.clearTimeout();
    }
}




