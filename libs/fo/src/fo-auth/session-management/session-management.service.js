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
    this.timeOutWarnInitialized = false;
    this.emitter = new EventEmitter();
}

/**
 * 
 * @param {*} watchObj 
 * @returns 
 */
SessionManagementService.prototype.startWatch = function(watchObj) {
    if (!this.started && !Object.is(watchObj, this.watchObj)) {
        this.watchObj = watchObj || this.watchObj;
        //set started variable
        this.started = true;
        this._attachEvents();
        this._trigger('isAlive');
        this.watchInterval = setInterval(this._watchManInterval.bind(this), this.session.interval || 1000);
        return;
    }
};

SessionManagementService.prototype._attachEvents = function() {
    this._unsubscribeListener = attachEventListener(this.session.events, ()=> {
        this.countDown = 0;
        if (this.isLastTriggered('isIdle')) {
            this._trigger('isIdleEnd');
        }
        //keep alive
        this.keepAlive = true;
        this._trigger('isAlive');
    });
}

SessionManagementService.prototype.destroy = function(removeAlert) {
    if (this.started) {
        //clear our interval
        //unbind events bound to document
        clearInterval(this.watchInterval);
        this._unsubscribeListener();
        this.countDown = this._currentTimer = 0;
        this.started = false;
        if (removeAlert) {
            this._trigger('isDestroyed');
        }
    }
};

//reset timer
SessionManagementService.prototype.reset = function() {
    //set the timeoutWarn
    //if it has been removed
    this.timeOutWarnInitialized = false;
};


SessionManagementService.prototype._watchManInterval = function() {
    if (Date.now() >= this.watchObj.expires_at) {
        this.keepAlive = false;
        this._trigger('isTimedOut');
        this.destroy();
        return;
    }

    //when to set user idle
    //current time is set to 60 seconds
    if (this.countDown >= this.session.idleTime) {
        this.keepAlive = false;
        this._trigger('isIdle');
    }

    if (this.keepAlive) {
        this._trigger('isAlive');
        if (this.session.timeOutWarn) {
            var tWarning = ((this.watchObj.expires_at - Date.now()) <= (this.session.timeOutWarn * 1000));
            if (tWarning && !this.timeOutWarnInitialized) {
                this._trigger('isTimeOutWarn');
                this.timeOutWarnInitialized = true;
            }
        }
    }

    //set countdown
    this.countDown++;
    this._currentTimer++;
}

SessionManagementService.prototype._trigger = function(eventName) {
    if (this.eventsName.includes(eventName) && !this.isLastTriggered(eventName)) {
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

SessionManagementService.prototype.isLastTriggered = function(eventName) {
    return this._lastTriggered === eventName;
}