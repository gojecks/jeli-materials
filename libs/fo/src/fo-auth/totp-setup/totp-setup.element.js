import { EventEmitter } from '@jeli/core';
import { FormControlService } from '@jeli/form';
import { TotpSetupService } from './totp-setup.service';

Element({
    selector: 'fo-totp-setup',
    templateUrl: './totp-setup.element.html',
    styleUrl: './totp-setup.element.scss',
    events: ['onSetupComplete:emitter'],
    props: ['btnText', 'showSecret'],
    DI: [TotpSetupService, 'changeDetector?']
})
export class TotpSetupElement {

    constructor(totpSetupService, changeDetector) {
        this.totpSetupService = totpSetupService;
        this.changeDetector = changeDetector;
        this.onSetupComplete = new EventEmitter();
        this.btnText = 'Set up 2FA';
        this.showSecret = false;
        this.secretVisible = false;
        this.step = 'init';   // init | scan | done
        this.isProcessing = false;
        this.error = false;
        this.errMsg = '';
        this.qrCode = null;
        this.recoveryCodes = [];
        this.secret = null;
        this.codeFormControl = new FormControlService({
            code: {
                validators: {
                    required: true,
                    minLength: 6,
                    maxLength: 6
                }
            }
        });
    }

    loadSetup() {
        this.processCheck();
        this.totpSetupService.setup()
            .then(res => {
                this.qrCode = res.result.qrCode;
                this.secret = res.result.secret;
                this.step = 'scan';
                this.processCheck();
            }, err => this.errorHandler(err));
    }

    enable() {
        if (this.codeFormControl.getField('code').invalid) return;
        this.processCheck();
        this.totpSetupService.enable(this.codeFormControl.value.code)
            .then(res => {
                this.recoveryCodes = (res && res.result && res.result.recoveryCodes) || [];
                this.step = 'done';
                this.processCheck();
                if (!this.recoveryCodes.length) this.finish();
            }, err => this.errorHandler(err));
    }

    // emitted once the user has seen their recovery codes
    finish() {
        this.onSetupComplete.emit({ enabled: true });
    }

    onDigitGroupChange(code) {
        this.codeFormControl.patchValue({ code });
    }

    toggleSecretVisible() {
        this.secretVisible = !this.secretVisible;
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
}
