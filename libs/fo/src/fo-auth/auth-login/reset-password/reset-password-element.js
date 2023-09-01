import { EventEmitter } from "@jeli/core";
import { FormControlService } from "@jeli/form";
import { LoginService } from "../login-service";
import { FoTokenService } from "../../fo-auth-token.service";

Element({
    selector: 'fo-reset-password',
    DI: [LoginService, FoTokenService, 'changeDetector?'],
    props: ["queryField", "waitingTime"],
    templateUrl: './reset-password.html',
    events: ['onLoginEvent:emitter']
});

/**
 * 
 * @param {*} loginService 
 * @param {*} foTokenService 
 * @param {*} changeDetector 
 */
export function FoResetPasswordElement(loginService, foTokenService, changeDetector) {
    this.changeDetector = changeDetector;
    this.foTokenService = foTokenService;
    this.loginService = loginService;
    this.error = false;
    this.success = false;
    this.isProcessing = false;
    this.errMsg = "";
    this.lastResetTime = null;
    this.identifier = "";
    this.onLoginEvent = new EventEmitter();
    this._waitingTime = 15;
    this.resetControl = new FormControlService({
        email: {
            validators: {
                required: true,
                emailValidation: true
            }
        },
        code: {
            validators: {
                required: true,
                minLength: 8
            }
        }
    });

    Object.defineProperty(this, 'waitingTime', {
        set: function(value) {
            this._waitingTime = value || 15
        }
    });
}

FoResetPasswordElement.prototype.submit = function() {
    if (this.resetControl.getField('email').invalid) return;
    this.reset();
    this.loginService.validateAndSendEmail({
            query: {
                email: this.resetControl.value.email
            },
            fields: this.queryField
        })
        .then(res => {
            this.identifier = res.result.identifier;
            this.success = true;
            this.processCheck();
            this.updateLastReset();
        }, res => {
            this.errMsg = (res.data || {}).reason;
            this.error = true;
            this.processCheck();
        });
};

FoResetPasswordElement.prototype.resendCode = function() {
    if (this.lastResetTime > +new Date) {
        return;
    }

    this.processCheck();
    this.loginService.resendCode(this.identifier)
        .then(() => {
            this.processCheck();
            this.updateLastReset();
        }, (err) => {
            this.errorHandler(err);
        });
};

FoResetPasswordElement.prototype.validateCode = function() {
    this.processCheck();
    this.loginService.validateCode({
            validationCode: this.resetControl.value.code,
            identifier: this.identifier,
            loginAfterValidation: true
        })
        .then(res => {
            this.foTokenService.saveAuthentication(res);
            this.onLoginEvent.emit({ reset: true });
        }, err => {
            this.errorHandler(err);
        });
};

FoResetPasswordElement.prototype.reset = function() {
    this.error = false;
    this.success = false;
    this.errMsg = "";
    this.isProcessing = true;
};

FoResetPasswordElement.prototype.processCheck = function(isError) {
    this.isProcessing = !this.isProcessing;
    this.error = isError;
    this.changeDetector.detectChanges();
};

FoResetPasswordElement.prototype.updateLastReset = function() {
    this.lastResetTime = +new Date(new Date().setMinutes(new Date().getMinutes() + this._waitingTime)).getTime();
};

FoResetPasswordElement.prototype.errorHandler = function(err) {
    this.processCheck(true);
    this.errMsg = (err.data || {}).message;
    this.error = true;
};