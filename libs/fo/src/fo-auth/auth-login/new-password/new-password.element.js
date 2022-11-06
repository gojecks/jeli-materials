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
    var _this = this;
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
                isSameAsOld: function(val) {
                    return val !== _this.postData.value.current;
                }
            }
        },
        confPasswd: {
            validators: {
                minLength: 8,
                mediumPasswordStrength: true,
                isSamePass: function(val) {
                    return val === _this.postData.value.newPasswd;
                }
            }
        }
    });
}

FoNewPassword.prototype.didInit = function() {
    var _this = this;
    if (!this.hardReset) {
        this.postData.addField('current', {
            eventType: 'blur',
            validators: {
                minLength: 8,
                async: function(pass) {
                    if (_this.hardReset || !pass) {
                        return Promise.resolve({ result: { isValid: true } });
                    }
                    return _this.loginService.validatePassword({ password: pass })
                        .then(function(res) {
                            return res.result.isValid;
                        }, function() {
                            return !!_this.hardReset;
                        });
                }
            }
        });
    }
}

FoNewPassword.prototype.process = function() {
    if (this.postData.invalid) return;
    var _this = this;
    this.isProcessing = true;
    this.error = this.success = false;
    this.loginService.
    resetPassword({
            _ref: this.userId,
            _data: { password: this.postData.value.newPasswd }
        })
        .then(function() {
            _this.success = true;
            _this.isProcessing = false;
            _this.onPasswordUpdate.emit({ success: true })
        }, function(err) {
            _this.error = true;
            _this.isProcessing = false;
            _this.onPasswordUpdate.emit({ success: false });
        });
};