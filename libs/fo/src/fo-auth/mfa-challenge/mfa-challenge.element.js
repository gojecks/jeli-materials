import { EventEmitter } from '@jeli/core';
import { LoginService } from '../auth-login/login-service';
import { FoTokenService } from '../fo-auth-token.service';

Element({
    selector: 'fo-mfa-challenge',
    templateUrl: './mfa-challenge.element.html',
    styleUrl: './mfa-challenge.element.scss',
    DI: [LoginService, FoTokenService, 'changeDetector?'],
    props: ['step:Any', 'withClient:Any', 'spinner:String'],
    events: ['onComplete:emitter', 'onCancel:emitter', 'onSetupDone:emitter']
})
export class FoMfaChallengeElement {
    spinner = 'spinner-border spinner-border-sm';
    step = null;
    withClient = null;
    constructor(loginService, foTokenService, changeDetector) {
        this.loginService = loginService;
        this.foTokenService = foTokenService;
        this.changeDetector = changeDetector;
        this.onComplete = new EventEmitter();
        this.onCancel = new EventEmitter();
        this.onSetupDone = new EventEmitter();
        this.code = '';
        this.useRecoveryCode = false;
        this.isProcessing = false;
        this.errMsg = '';
        this.policy = null;
        this.rememberDevice = false;
        // true while a stored trusted-device token is being tried
        this.isCheckingDevice = false;
    }

    get trustDays() {
        const trust = this.policy && this.policy.mfa && this.policy.mfa.trustDevice;
        return (trust && trust.enabled) ? trust.ttlDays : 0;
    }

    get isSetup() {
        return !!this.step && this.step.status === 'mfa_setup_required';
    }

    didInit() {
        // setup-only token: lets fo-totp-setup reach the 2FA routes without marking the user signed in
        if (this.isSetup) return this.foTokenService.setAccessToken(this.step.tokens);
        this.policy = LoginService.peekPolicy(this.withClient);
        this.loginService.getPolicy(this.withClient).then(policy => {
            this.policy = policy;
            this.detectChanges();
        });
        this.tryTrustedDevice();
    }

    tryTrustedDevice() {
        const deviceToken = LoginService.getDeviceToken(this.withClient);
        if (!deviceToken || !this.step) return;
        this.isCheckingDevice = true;
        this.loginService.verifySecondFactor(this.step.challenge_id, null, this.withClient, { deviceToken })
            .then(res => {
                this.isCheckingDevice = false;
                this.onComplete.emit(res);
            }, () => {
                // revoked, expired, another account's, or the app stopped trusting devices
                LoginService.forgetDeviceToken(this.withClient);
                this.isCheckingDevice = false;
                this.detectChanges();
            });
    }

    onRememberChange(event) {
        this.rememberDevice = !!event.target.checked;
    }

    get canVerify() {
        const code = (this.code || '').trim();
        return !this.isProcessing && (this.useRecoveryCode ? code.length >= 10 : code.length === 6);
    }

    onDigitGroupChange(code) {
        this.code = code;
    }

    onRecoveryInput(event) {
        this.code = event.target.value;
    }

    toggleRecoveryCode() {
        this.useRecoveryCode = !this.useRecoveryCode;
        this.code = '';
        this.errMsg = '';
    }

    verify() {
        if (!this.canVerify) return;
        this.isProcessing = true;
        this.errMsg = '';
        this.loginService.verifySecondFactor(this.step.challenge_id, this.code, this.withClient, { rememberDevice: this.rememberDevice && this.trustDays > 0 })
            .then(res => {
                this.isProcessing = false;
                this.onComplete.emit(res);
            }, () => {
                this.isProcessing = false;
                this.errMsg = this.useRecoveryCode
                    ? 'That recovery code didn\'t work, or has already been used.'
                    : 'That code didn\'t work. Check your authenticator app and try again.';
                this.detectChanges();
            });
    }

    setupDone() {
        this.foTokenService.destroy();
        this.onSetupDone.emit(true);
    }

    cancel() {
        if (this.isSetup) this.foTokenService.destroy();
        this.onCancel.emit(true);
    }

    detectChanges() {
        if (this.changeDetector) this.changeDetector.detectChanges();
    }
}
