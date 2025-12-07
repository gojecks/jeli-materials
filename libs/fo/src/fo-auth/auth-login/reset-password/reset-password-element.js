import { EventEmitter } from "@jeli/core";
import { FormControlService } from "@jeli/form";
import { LoginService } from "../login-service";
import { FoTokenService } from "../../fo-auth-token.service";

Element({
    selector: 'fo-reset-password',
    DI: [LoginService, FoTokenService, 'changeDetector?'],
    props: [
        'queryField', 
        'email', 
        'waitingTime', 
        'resetCodeInputAmount', 
        'message',
        'size', 
        'spinner'
    ],
    templateUrl: './reset-password.html',
    styleUrl: './reset-password-element.scss',
    events: ['onLoginEvent:emitter']
})
/**
 *
 * @param {*} loginService
 * @param {*} foTokenService
 * @param {*} changeDetector
 */
export class FoResetPasswordElement {
    spinner = 'spinner-border spinner-border-sm';
    constructor(loginService, foTokenService, changeDetector) {
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
        this._resetCodeInputAmount = 6;
        this.size = 'md';
        this.resetControl = new FormControlService({
            code: {
                validators: {
                    required: true,
                    minLength: 6
                }
            }
        });
    }

    set waitingTime(value) {
        this._waitingTime = value || 15;
    }

    get waitingTime(){
        return this._waitingTime;
    }

    set resetCodeInputAmount(value) {
        this._resetCodeInputAmount = value || 6;
    }

    get resetCodeInputAmount(){
        return this._resetCodeInputAmount;
    }
    
    didInit() {
        this.resetControl.addField('email', {
            value: this.email || null,
            disabled: !!this.email,
            validators: {
                required: true,
                emailValidation: true
            }
        });
    }
    submit() {
        if (this.resetControl.getField('email').invalid) return;
        this.reset();
        this.loginService.validateAndSendEmail({
            query: {
                email: this.resetControl.getAllValues().email
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
    }
    resendCode() {
        if (this.lastResetTime > +new Date) {
            return;
        }

        this.processCheck();
        this.loginService.resendCode(this.identifier)
            .then(() => {
                this.processCheck();
                this.updateLastReset();
            }, (err) => this.errorHandler(err));
    }
    validateCode() {
        this.processCheck();
        this.loginService.validateCode({
            validationCode: this.resetControl.value.code,
            identifier: this.identifier,
            loginAfterValidation: true
        })
            .then(res => {
                this.foTokenService.saveAuthentication(res);
                this.onLoginEvent.emit({ success: true, reset: true });
            }, err => this.errorHandler(err));
    }
    reset() {
        this.error = false;
        this.success = false;
        this.errMsg = "";
        this.isProcessing = true;
    }
    processCheck(isError) {
        this.isProcessing = !this.isProcessing;
        this.error = isError;
        this.changeDetector.detectChanges();
    }
    updateLastReset() {
        this.lastResetTime = +new Date(new Date().setMinutes(new Date().getMinutes() + this._waitingTime)).getTime();
    }
    errorHandler(err) {
        this.processCheck(true);
        err = err || { message: 'Unable to process request' };
        this.errMsg = (err.data || err).message;
        this.error = true;
    }

    onDigitGroupChange(code){
        this.resetControl.patchValue({
            code
        });
    }
}
