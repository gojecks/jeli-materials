import { EventEmitter } from "@jeli/core";
import { FormControlService, FormValidationStack } from "@jeli/form";
import { OtpService } from "./otp.service";

Element({
    selector: 'fo-otp',
    templateUrl: './otp.element.html',
    styleUrl: './otp.element.scss',
    events: ['onOTPVerified:emitter'],
    DI: [OtpService, 'changeDetector?'],
    props: ['type', 'waitingTime', 'resetCodeInputAmount', 'message', 'countryCode', 'eventId', 'provider']
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
        // optional { send(identifier, type), verify(identifier, code), resend?(identifier), resendAfter?, sentMessage?(identifier) }; defaults to /otp/create + /otp/validate
        this.provider = null;
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
                            return /^\+?[0-9]{7,15}$/.test(String(val || '').replace(/[\s().-]/g, ''))
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

    get codeProvider() {
        return this.provider || {
            send: (identifier, type) => this.otpService.sendCode(identifier, type).then(res => res.result),
            verify: (identifier, code) => this.otpService.validateCode(identifier, code, this.eventId)
        };
    }

    get sentMessage() {
        const provider = this.codeProvider;
        return provider.sentMessage
            ? provider.sentMessage(this.otpFormControl.value.identifier)
            : `Verification code sent to ${this.otpFormControl.value.identifier}. Please check your messages with ref: ${(this.response || {}).ref}.`;
    }

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
        this.codeProvider
            .send(this.identifier, this.type)
            .then((res) => {
                this.response = res;
                this.success = true;
                this.processCheck();
                this.startExpiredCheck();
            }, err =>  this.errorHandler(err));
    }

    resendCode() {
        const provider = this.codeProvider;
        if (!provider.resend) return this.sendCode();
        if (!this.expired || this.isProcessing) return;
        this.reset();
        provider.resend(this.response.identifier).then(() => {
            this.processCheck();
            this.startExpiredCheck();
        }, err => this.errorHandler(err));
    }

    // back to the identifier step
    changeIdentifier() {
        clearTimeout(this.timerId);
        this.success = false;
        this.error = false;
        this.response = null;
        this.otpFormControl.patchValue({ code: '' });
        this.detectChanges();
    }

    validateCode() {
        this.processCheck();
        this.codeProvider.verify(this.response.identifier, this.otpFormControl.value.code)
            .then(result => {
                this.isProcessing = false;
                this.onOTPVerified.emit({ value: this.identifier, verified: true, result });
            }, err => this.errorHandler(err));
    }

    startExpiredCheck(){
        // re-enables resend: after the provider's cooldown, else once the code expires
        const provider = this.codeProvider;
        this.expired = false;
        clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
            this.expired = true;
            this.detectChanges();
        }, provider.resendAfter ? provider.resendAfter * 1000 : (this.response.expires - Date.now()))
    }

    detectChanges() {
        if (this.changeDetector) this.changeDetector.detectChanges();
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
