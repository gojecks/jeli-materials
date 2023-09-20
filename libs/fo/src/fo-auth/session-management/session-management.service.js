import { attachEventListener, SessionEvent } from "./utils";
import { EventEmitter } from "@jeli/core";

/**
 * Watch Obj requires OAUTH 2.0 JSON format
 *    set timeout time using 
 *   var expiredAt = new Date();
 *  expiredAt.setSeconds(expiredAt.getSeconds() + expires_in);
 *   @require Object
 *  expires_at : Date() in Milliseconds (see example above)
 *   expires_in : Number
 * @param {*} session 
 */
export function SessionManagementService(sessionConfig) {
    this.session = sessionConfig;
    this.watchObj = {
        expires_at: new Date().setSeconds(1500),
        expires_in: 1500
    };
    this.watchInterval = null;
    this.keepAlive = 1;
    this.countDown = 0;
    this._currentTimer = 0;
    this.handler = {};
    this.started = false;
    this._lastTriggered = null;
    this.eventsName = ['isAlive', 'isIdleEnd', 'isIdle', 'isTimedOut', 'isTimeOutWarn'];
    this.timeoutWarnPercent = 0
    this.timeOutWarnInitialized = false;
    this.emitter = new EventEmitter();
    this.hasEvent = eventName => this.eventsName.includes(eventName);
}

/**
 * 
 * @param {*} watchObj 
 * @returns 
 */
SessionManagementService.prototype.startWatch = function (watchObj) {
    if (!this.started && !Object.is(watchObj, this.watchObj)) {
        this.watchObj = watchObj || this.watchObj;
        //set started variable
        this.started = true;
        this._trigger('isAlive');
        this.timeoutWarnPercent = ((this.watchObj.expires_in / 100) * (this.session.timeOutWarn || 0));
        this.watchInterval = setInterval(this._watchManInterval.bind(this), this.session.interval || 1000);
        this._attachEvents();
        return;
    }
};

SessionManagementService.prototype._attachEvents = function () {
    this._unsubscribeListener = attachEventListener(this.session.events, () => this.reset());
}

SessionManagementService.prototype.destroy = function (removeAlert) {
    if (this.started) {
        //clear our interval
        //unbind events bound to document
        clearInterval(this.watchInterval);
        this._unsubscribeListener && this._unsubscribeListener();
        this.countDown = this._currentTimer = 0;
        this.started = false;
        if (removeAlert) {
            this._trigger('isDestroyed');
        }
    }
};

//reset timer
SessionManagementService.prototype.reset = function () {
    this.countDown = 0;
    if (this.isLastTriggered('isIdle')) {
        this._trigger('isIdleEnd');
    }
    //keep alive
    this.keepAlive = true;
    this._trigger('isAlive');
    //set the timeoutWarn
    //if it has been removed
    this.timeOutWarnInitialized = false;
};


SessionManagementService.prototype._watchManInterval = function () {
    if (Date.now() >= this.watchObj.expires_at) {
        this.keepAlive = false;
        this._trigger('isTimedOut');
        this.destroy();
        return;
    }

    // when to set user idle
    // current time is set to 300 seconds
    if (this.countDown >= this.session.idleTime && this.keepAlive) {
        this.keepAlive = false;
        this._trigger('isIdle');
    }

    if (this.keepAlive) {
        if (this.session.timeOutWarn) {
            var tWarning = this.getTimeOutWarning();
            if (tWarning && !this.timeOutWarnInitialized) {
                this._trigger('isTimeOutWarn');
                this.keepAlive = false;
                this.timeOutWarnInitialized = true;
                return;
            }
        }

        this._trigger('isAlive');
    }

    //set countdown
    this.countDown++;
    this._currentTimer++;
}

SessionManagementService.prototype._trigger = function (eventName) {
    if (this.hasEvent(eventName) && !this.isLastTriggered(eventName)) {
        var event = new SessionEvent(eventName,
            this.watchObj.expires_at,
            this.watchObj.expires_in,
            this.keepAlive,
            this.countDown,
            this._currentTimer
        );

        this.emitter.emit(event);
        event = null;
    }
};

SessionManagementService.prototype.isLastTriggered = function (eventName) {
    return this._lastTriggered === eventName;
}

SessionManagementService.prototype.getTimeOutWarning = function () {
    return (this.timeoutWarnPercent && ((Date.now() - this.watchObj.expires_at) >= this.timeoutWarnPercent));
}