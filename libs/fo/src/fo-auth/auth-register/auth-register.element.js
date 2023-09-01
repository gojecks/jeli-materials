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
                async: (email) => {
                    return this.handleValidation('email', email);
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
AuthRegisterElement.prototype.handleValidation = function (field, value) {
    if (!value) {
        return Promise.resolve(true);
    }

    return this.loginService.validateInput(field, value)
        .then(res => {
            this.changeDetector.detectChanges();
            return !res.isExists;
        });
}

AuthRegisterElement.prototype.isInvalidField = function (field) {
    var fieldControl = this.regoForm.getField(field);
    return fieldControl && fieldControl.touched && fieldControl.invalid;
};

/**
 * initialize the registration
 * validate user email before registering user
 * email exists triggers error
 */
AuthRegisterElement.prototype.registerAccount = function () {
    this.isProcessing = true;
    /**
     * 
     * @param {*} state 
     * @param {*} res 
     */
    var emit = (state, res) => {
        this.isProcessing = false;
        if (state) {
            var postData = res.postData;
            delete postData._data.password;
            this.foTokenService.saveAuthentication(res);
        }
        this.changeDetector.detectChanges();
        this.onAuthRegister.emit(state);
    };

    this.loginService.userServices.add(this.regoForm.value)
        .then(function (res) {
            emit(true, res);
        }, function (err) {
            emit(false, err);
        });
};