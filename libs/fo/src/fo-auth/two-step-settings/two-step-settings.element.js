import { TotpSetupService } from '../totp-setup/totp-setup.service';
import { LoginService } from '../auth-login/login-service';

Element({
    selector: 'fo-two-step-settings',
    templateUrl: './two-step-settings.element.html',
    styleUrl: './two-step-settings.element.scss',
    DI: [TotpSetupService, LoginService, 'changeDetector?'],
    props: ['withClient:Any']
})
export class FoTwoStepSettingsElement {
    withClient = null;
    constructor(totpSetupService, loginService, changeDetector) {
        this.totpSetupService = totpSetupService;
        this.loginService = loginService;
        this.changeDetector = changeDetector;
        this.status = null;
        this.policy = null;
        // null | 'regenerate' | 'disable'
        this.action = null;
        this.code = '';
        this.newCodes = [];
        this.isProcessing = false;
        this.errMsg = '';
        this.devices = [];
    }

    get isTrustOffered() {
        return !!(this.policy && this.policy.mfa && this.policy.mfa.trustDevice && this.policy.mfa.trustDevice.enabled);
    }

    get isRequired() {
        return !!(this.policy && this.policy.mfa && this.policy.mfa.enabled && this.policy.mfa.enforcement === 'required');
    }

    get isAskedAtSignIn() {
        return !this.policy || !!(this.policy.mfa && this.policy.mfa.enabled);
    }

    get isLowOnCodes() {
        return !!this.status && this.status.recoveryCodesRemaining <= 3;
    }

    didInit() {
        this.policy = LoginService.peekPolicy(this.withClient);
        this.loginService.getPolicy(this.withClient).then(policy => {
            this.policy = policy;
            this.detectChanges();
        });
        this.refresh();
    }

    refresh() {
        this.action = null;
        this.totpSetupService.status().then(status => {
            this.status = status;
            this.detectChanges();
            if (status.enabled) this.loadDevices();
        }, err => this.fail(err, 'Unable to load your two-step verification status.'));
    }

    loadDevices() {
        this.totpSetupService.listDevices().then(devices => {
            this.devices = devices;
            this.detectChanges();
        }, () => {});
    }

    // no id: every device
    revokeDevice(id) {
        this.totpSetupService.revokeDevice(id).then(() => {
            if (!id) LoginService.forgetDeviceToken(this.withClient);
            this.loadDevices();
        }, err => this.fail(err, 'Unable to remove that device.'));
    }

    deviceDate(seconds) {
        return new Date(seconds * 1000).toLocaleDateString();
    }

    start(action) {
        this.action = action;
        this.code = '';
        this.errMsg = '';
        this.newCodes = [];
    }

    cancel() {
        this.action = null;
        this.errMsg = '';
    }

    onDigitGroupChange(code) {
        this.code = code;
    }

    confirm() {
        if (this.code.length < 6 || this.isProcessing) return;
        this.isProcessing = true;
        this.errMsg = '';
        const request = this.action === 'disable'
            ? this.totpSetupService.disable(this.code).then(() => this.refresh())
            : this.totpSetupService.regenerateRecoveryCodes(this.code).then(codes => {
                this.newCodes = codes;
                this.action = 'codes';
            });

        request.then(() => {
            this.isProcessing = false;
            this.detectChanges();
        }, err => this.fail(err, 'That code didn\'t work. Check your authenticator app and try again.'));
    }

    doneWithCodes() {
        this.newCodes = [];
        this.refresh();
    }

    fail(err, fallback) {
        this.isProcessing = false;
        this.errMsg = ((err && (err.data || err).message) || fallback);
        this.detectChanges();
    }

    detectChanges() {
        if (this.changeDetector) this.changeDetector.detectChanges();
    }
}
