import {EventEmitter, rxTimeout} from '@jeli/core';
Directive({
    selector: 'longPress',
    props: ['timeout'],
    events: ['mousedown mouseup:event=handleEvent($event)', 'longPressChange:emitter']
})
export function LongPressDirective(){
    this.timeout = 1500;
    this.timerId = new rxTimeout();
    this.longPressChange = new EventEmitter();
}

LongPressDirective.prototype.didInit = function(){
    this.timerId.subscribe(() => this.longPressChange.emit({type: 'longPress'}));
}

LongPressDirective.prototype.handleEvent = function(event){
    if(event.type == 'mousedown'){
        this.timerId.play(this.timeout);
    } else if (event.type == 'mouseup'){
        this.timerId.stop();
    }
}

LongPressDirective.prototype.viewDidDestroy = function(){
    this.timerId.clearTimeout();
}
