import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';
import { LoginService } from '../login-service';
Element({
    selector: 'fo-new-password',
    DI: [LoginService, "changeDetector?"],
    templateUrl: './new-password.element.html',
    props: ["hardReset", "userId", "smMode", 'spinner'],
    events: ["onPasswordUpdate:emitter"]
})
export class FoNewPassword {
    smMode = false;
    spinner = 'spinner-border spinner-border-sm';
    constructor(loginService, changeDetector) {
        this.requestDone = false;
        this.error = false;
        this.isProcessing = false;
        this.loginService = loginService;
        this.changeDetector = changeDetector;
        this.onPasswordUpdate = new EventEmitter();
        this.postData = new FormControlService({
            newPasswd: {
                validators: {
                    required: true,
                    minLength: 8,
                    mediumPasswordStrength: true,
                    isSameAsOld: val => {
                        return val !== this.postData.value.current;
                    }
                }
            },
            confPasswd: {
                validators: {
                    required: true,
                    minLength: 8,
                    mediumPasswordStrength: true,
                    isSamePass: val => {
                        return val === this.postData.value.newPasswd;
                    }
                }
            }
        });
    }
    
    didInit() {
        if (!this.hardReset) {
            this.postData.addField('current', {
                eventType: 'blur',
                validators: {
                    minLength: 8,
                    required: true
                }
            });
        }
    }

    process() {
        if (this.postData.invalid) return;
        this.isProcessing = true;
        this.requestDone = false;
        this.error = this.success = false;
        const allDone = (isDone, msg) => {
            this.error = !isDone;
            this.message = msg;
            this.requestDone = true;
            this.isProcessing = false;
            this.changeDetector.onlySelf();
            this.onPasswordUpdate.emit({ success: isDone });
        };

        this.loginService.
            resetPassword({ password: this.postData.value.newPasswd }, this.postData.value.current)
            .then(() => allDone(true), (err) => allDone(false, err.message));
    }

    isInvalidField(field) {
        var fieldControl = this.postData.getField(field);
        return fieldControl && fieldControl.touched && fieldControl.invalid;
    }
}



