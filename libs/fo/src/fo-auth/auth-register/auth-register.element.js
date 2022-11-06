import { LoginService } from "../auth-login/login-service";
import { FoTokenService } from "../fo-auth-token.service";
import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';

Element({
    selector: 'fo-auth-register',
    templateUrl: './auth-register.element.html',
    styleUrl: './auth-register.element.scss',
    DI: [LoginService, FoTokenService, 'changeDetector?'],
    events: [
        "onAuthRegister:emitter"
    ],
    props: ["buttonText", "regoForm"]
})
export function AuthRegisterElement(loginService, foTokenService, changeDetector) {
    var _this = this;
    /**
     * additional form to be rendered dynamically
     */
    this.additionalForm = null;
    this.loginService = loginService;
    this.foTokenService = foTokenService;
    this.changeDetector = changeDetector;
    this.isProcessing = false;
    this.onAuthRegister = new EventEmitter();
    this.regoForm = new FormControlService({
        email: {
            eventType: 'blur',
            validators: {
                emailValidation: true,
                async: function(email) {
                    return _this.handleValidation('email', email);
                }
            }
        },
        password: {
            validators: {
                minLength: 8,
                mediumPasswordStrength: true
            }
        }
    });
}

/**
 * 
 * @param {*} field 
 * @param {*} value 
 * @returns 
 */
AuthRegisterElement.prototype.handleValidation = function(field, value) {
    if (!value) {
        return Promise.resolve(true);
    }

    var _this = this;
    return this.loginService.validateInput(field, value)
        .then(function(res) {
            _this.changeDetector.detectChanges();
            return !res.isExists;
        });
}

AuthRegisterElement.prototype.isInvalidField = function(field) {
    var fieldControl = this.regoForm.getField(field);
    return fieldControl && fieldControl.touched && fieldControl.invalid;
};

/**
 * initialize the registration
 * validate user email before registering user
 * email exists triggers error
 */
AuthRegisterElement.prototype.registerAccount = function() {
    var _this = this;
    this.isProcessing = true;
    this.loginService.userServices.add(this.regoForm.value)
        .then(function(res) {
            emit(true, res);
        }, function(err) {
            emit(false, err);
        });

    /**
     * 
     * @param {*} state 
     * @param {*} res 
     */
    function emit(state, res) {
        _this.isProcessing = false;
        if (state) {
            var postData = res.postData;
            delete postData._data.password;
            _this.foTokenService.saveAuthentication(res);
        }
        _this.changeDetector.detectChanges();
        _this.onAuthRegister.emit(state);
    }
};