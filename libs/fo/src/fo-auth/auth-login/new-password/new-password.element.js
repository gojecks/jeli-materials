import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';
import { LoginService } from '../login-service';
Element({
    selector: 'fo-new-password',
    DI: [LoginService, "changeDetector?"],
    templateUrl: './new-password.element.html',
    props: ["hardReset", "userId"],
    events: ["onPasswordUpdate:emitter"]
})
export function FoNewPassword(loginService, changeDetector) {
    this.success = false;
    this.error = false;
    this.isProcessing = false;
    this.loginService = loginService;
    this.changeDetector = changeDetector;
    this.onPasswordUpdate = new EventEmitter();
    this.postData = new FormControlService({
        newPasswd: {
            validators: {
                minLength: 8,
                mediumPasswordStrength: true,
                isSameAsOld: val => {
                    return val !== this.postData.value.current;
                }
            }
        },
        confPasswd: {
            validators: {
                minLength: 8,
                mediumPasswordStrength: true,
                isSamePass: val => {
                    return val === this.postData.value.newPasswd;
                }
            }
        }
    });
}

FoNewPassword.prototype.didInit = function() {
    if (!this.hardReset) {
        this.postData.addField('current', {
            eventType: 'blur',
            validators: {
                minLength: 8,
                async: pass => {
                    if (this.hardReset || !pass) {
                        return Promise.resolve({ result: { isValid: true } });
                    }
                    return this.loginService.validatePassword({ password: pass })
                        .then(res => res.result.isValid, () => !!this.hardReset);
                }
            }
        });
    }
}

FoNewPassword.prototype.process = function() {
    if (this.postData.invalid) return;
    this.isProcessing = true;
    this.error = this.success = false;
    this.loginService.
    resetPassword({
            _ref: this.userId,
            _data: { password: this.postData.value.newPasswd }
        })
        .then(() => {
            this.success = true;
            this.isProcessing = false;
            this.onPasswordUpdate.emit({ success: true })
        }, (err)=> {
            this.error = true;
            this.isProcessing = false;
            this.onPasswordUpdate.emit({ success: false });
        });
};