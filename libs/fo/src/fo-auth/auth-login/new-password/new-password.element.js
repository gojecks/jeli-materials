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
    this.requestDone = false;
    this.error = false;
    this.isProcessing = false;
    this.loginService = loginService;
    this.changeDetector = changeDetector;
    this.onPasswordUpdate = new EventEmitter();
    this.postData = new FormControlService({
        newPasswd: {
            validators: {
                required:true,
                minLength: 8,
                mediumPasswordStrength: true,
                isSameAsOld: val => {
                    return val !== this.postData.value.current;
                }
            }
        },
        confPasswd: {
            validators: {
                required:true,
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
                required: true
            }
        });
    }
}

FoNewPassword.prototype.process = function() {
    if (this.postData.invalid) return;
    this.isProcessing = true;
    this.requestDone = false;
    this.error = this.success = false;
    var allDone = isDone => {
        this.error = !isDone;
        this.requestDone = true;
        this.isProcessing = false;
        this.changeDetector.onlySelf();
        this.onPasswordUpdate.emit({ success: isDone })
    };

    this.loginService.
    resetPassword({ password: this.postData.value.newPasswd }, this.postData.value.current)
        .then(() => allDone(true), () => allDone(false));
};

FoNewPassword.prototype.isInvalidField = function (field) {
    var fieldControl = this.postData.getField(field);
    return fieldControl && fieldControl.touched && fieldControl.invalid;
};