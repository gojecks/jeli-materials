import { EventEmitter } from '@jeli/core';
import { SwipeGesture } from '../services/swipe-gesture';

// <div :foSwipe="left,right" @swipe="onSwipe($event)"> - touch events, since a pointer stream is cancelled once the browser scrolls
Directive({
    selector: 'foSwipe',
    props: ['directions=:foSwipe', 'threshold'],
    events: ['touchstart touchend touchcancel:event=handleTouch($event)', 'swipe:emitter']
})
export class FoSwipeDirective {
    constructor() {
        this.directions = '';
        this.threshold = 40;
        this.swipe = new EventEmitter();
        this._start = null;
    }

    handleTouch(event) {
        if (event.type === 'touchstart') {
            // dragging a slider or scrolling a field inside the panel is not a swipe
            var ignore = event.target && event.target.closest && event.target.closest('input, select, textarea, [data-no-swipe]');
            var touch = !ignore && event.touches.length === 1 && event.touches[0];
            this._start = touch ? { x: touch.clientX, y: touch.clientY, time: Date.now(), scrollTop: (event.currentTarget && event.currentTarget.scrollTop) || 0 } : null;
            return;
        }

        var start = this._start;
        this._start = null;
        if (!start || event.type === 'touchcancel' || !event.changedTouches.length) return;
        var end = event.changedTouches[0];
        var direction = SwipeGesture.direction(end.clientX - start.x, end.clientY - start.y, Date.now() - start.time, { threshold: Number(this.threshold) || 40 });
        if (!direction || !SwipeGesture.allowed(direction, this.directions)) return;
        // a downward swipe inside a scrolled panel is the visitor scrolling back up, not dismissing it
        if (direction === 'down' && start.scrollTop > 0) return;
        this.swipe.emit(direction);
    }
}
