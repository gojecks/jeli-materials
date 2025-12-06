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
export class SessionManagementService {
    constructor(sessionConfig) {
        this.session = sessionConfig;
        this.userSession = {
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
        this.actualExpiresIn = 0;
        this.timeOutWarnInitialized = false;
        this.emitter = new EventEmitter();
        this.hasEvent = eventName => this.eventsName.includes(eventName);
    }

    get timeOutWarning() {
        return Math.round((this.userSession.expires_at - new Date()) / 1000) <= (this.session.timeOutWarn || 100);
    }

    /**
     *
     * @param {*} userSession
     * @returns
     */
    startWatch(userSession) {
        if (!this.started && !Object.is(userSession, this.userSession)) {
            this.userSession = userSession || this.userSession;
            //set started variable
            this.started = true;
            this._trigger('isAlive');
            this.watchInterval = setInterval(() => this._watchManInterval(), this.session.interval || 1000);
            this._attachEvents();
            return;
        }
    }

    refreshUserSession(userSession){
        if(!this.started){
            this.startWatch(userSession);
        } else {
            this.userSession = userSession;
        }
    }

    _attachEvents() {
        this._unsubscribeListener = attachEventListener(this.session.events, () => this.reset());
    }

    destroy(removeAlert) {
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
    }

    //reset timer
    reset() {
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
    }

    _watchManInterval() {
        if (Date.now() >= this.userSession.expires_at) {
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
                if (this.timeOutWarning && !this.timeOutWarnInitialized) {
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

    _trigger(eventName) {
        if (this.hasEvent(eventName) && !this.isLastTriggered(eventName)) {
            var event = new SessionEvent(eventName,
                this.userSession.expires_at,
                this.userSession.expires_in,
                this.keepAlive,
                this.countDown,
                this._currentTimer
            );

            this.emitter.emit(event);
            event = null;
        }
    }

    isLastTriggered(eventName) {
        return this._lastTriggered === eventName;
    }
}









