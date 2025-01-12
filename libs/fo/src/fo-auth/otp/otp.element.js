import { EventEmitter } from "@jeli/core";
import { FormControlService, FormValidationStack } from "@jeli/form";
import { OtpService } from "./otp.service";

Element({
    selector: 'fo-otp',
    templateUrl: './otp.element.html',
    styleUrl: './otp.element.scss',
    events: ['onOTPVerified:emitter'],
    DI: [OtpService, 'changeDetector?'],
    props: ['type', 'waitingTime', 'resetCodeInputAmount', 'message', 'countryCode', 'eventId']
})
export class FoOtpElement {

    constructor(otpService, changeDetector) {
        this.changeDetector = changeDetector;
        this.otpService = otpService;
        this.error = false;
        this.success = false;
        this.isProcessing = false;
        this.errMsg = "";
        this.lastResetTime = null;
        this.identifier = "";
        this.onOTPVerified = new EventEmitter();
        this._waitingTime = 15;
        this._resetCodeInputAmount = 6;
        this.response = null;
        this.expired = false;
        this.countryCode = '';
        this.timerId = null;
        this.eventId = null;
        this.otpFormControl = new FormControlService({
            code: {
                validators: {
                    required: true,
                    minLength: 6
                }
            },
            identifier: {
                value: null,
                validators: {
                    required: true,
                    input: val => {
                        if(this.type == 'email') 
                            return FormValidationStack.EMAILVALIDATION(val)
                        else
                            return val.length > 8
                    }
                }
            }
        });
    }

    set waitingTime(value) {
        this._waitingTime = value || 15;
    }

    get waitingTime() {
        return this._waitingTime;
    }

    set resetCodeInputAmount(value) {
        this._resetCodeInputAmount = value || 6;
    }

    get resetCodeInputAmount() {
        return this._resetCodeInputAmount;
    }

    didInit() { }

    viewDidDestroy(){
        clearTimeout(this.timerId);
    }

    sendCode() {
        if (this.otpFormControl.getField('identifier').invalid) return;
        if (this.response && this.response.expires > +new Date) {
            return;
        }

        this.reset();
        this.identifier = `${this.countryCode || ''}${this.otpFormControl.value.identifier}`;
        this.otpService
            .sendCode(this.identifier, this.type)
            .then((res) => {
                this.response = res.result;
                this.success = true;
                this.processCheck();
                this.startExpiredCheck();
            }, err =>  this.errorHandler(err));
    }

    validateCode() {
        this.processCheck();
        this.otpService.validateCode(this.response.identifier, this.otpFormControl.value.code, this.eventId)
            .then(() => {
                this.onOTPVerified.emit({ value: this.identifier, verified: true });
            }, err => this.errorHandler(err));
    }

    startExpiredCheck(){
        // set a timeout to enable the send resend button
        this.timerId = setTimeout(() => {
            this.expired = true;
            this.changeDetector.onlySelf();
        }, (this.response.expires - Date.now()))
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

    errorHandler(err) {
        err = err || { message: 'Unable to process request' };
        this.errMsg = (err.data || err).message;
        this.processCheck(true);
    }

    onDigitGroupChange(code) {
        this.otpFormControl.patchValue({ code });
    }
}
