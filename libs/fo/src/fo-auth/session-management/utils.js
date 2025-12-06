/**
 * 
 * @param {*} expiresAt 
 * @param {*} expiresIn 
 * @param {*} keepAlive 
 * @param {*} countDown 
 * @param {*} _currentTimer 
 */
/**
 *
 * @param {*} expiresAt
 * @param {*} expiresIn
 * @param {*} keepAlive
 * @param {*} countDown
 * @param {*} _currentTimer
 */
export class SessionEvent {
    constructor(eventName, expiresAt, expiresIn, keepAlive, countDown, _currentTimer) {
        this.type = eventName;
        this.currentTime = Date.now();
        this.expiresAt = expiresAt;
        this.expiresIn = expiresIn;
        this.$current = _currentTimer;
        this.isAlive = keepAlive;
        this.idle = countDown;
    }

    canRevalidate(diff) {
        return (diff ? ((this.expiresAt - this.currentTime) <= (diff * 1000)) : false);
    }
}

/**
 * 
 * @param {*} events 
 * @param {*} handler 
 */
export function attachEventListener(events, handler) {
    events.forEach(function(ev) {
        document.addEventListener(ev, handler, false);
    });

    return function() {
        events.forEach(function(ev) {
            document.removeEventListener(ev, handler, false);
        });
    };
}