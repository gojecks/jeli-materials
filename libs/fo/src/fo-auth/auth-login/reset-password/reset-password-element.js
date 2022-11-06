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
    var _this = this;
    this.reset();
    this.loginService.validateAndSendEmail({
            query: {
                email: this.resetControl.value.email
            },
            fields: this.queryField
        })
        .then(function(res) {
            _this.identifier = res.result.identifier;
            _this.success = true;
            _this.processCheck();
            _this.updateLastReset();
        }, function(res) {
            _this.errMsg = (res.data || {}).reason;
            _this.error = true;
            _this.processCheck();
        });
};

FoResetPasswordElement.prototype.resendCode = function() {
    if (this.lastResetTime > +new Date) {
        return;
    }

    var _this = this;
    this.processCheck();
    this.loginService.resendCode(this.identifier)
        .then(function() {
            _this.processCheck();
            _this.updateLastReset();
        }, function(err) {
            _this.errorHandler(err);
        });
};

FoResetPasswordElement.prototype.validateCode = function() {
    var _this = this;
    this.processCheck();
    this.loginService.validateCode({
            validationCode: this.resetControl.value.code,
            identifier: this.identifier,
            loginAfterValidation: true
        })
        .then(function(res) {
            _this.foTokenService.saveAuthentication(res);
            _this.onLoginEvent.emit({ reset: true });
        }, function(err) {
            _this.errorHandler(err);
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