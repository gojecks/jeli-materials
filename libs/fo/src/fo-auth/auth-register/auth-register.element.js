import { FoTokenService } from "../fo-auth-token.service";
import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';
import { RegisterService } from "./register.service";

Element({
    selector: 'fo-auth-register',
    templateUrl: './auth-register.element.html',
    styleUrl: './auth-register.element.scss',
    DI: [RegisterService, FoTokenService, 'changeDetector?'],
    events: [
        "onAuthRegister:emitter"
    ],
    props: ["buttonText", "regoForm"]
})
export function AuthRegisterElement(registerService, foTokenService, changeDetector) {
    /**
     * additional form to be rendered dynamically
     */
    this.additionalForm = null;
    this.registerService = registerService;
    this.foTokenService = foTokenService;
    this.changeDetector = changeDetector;
    this.isProcessing = false;
    this.onAuthRegister = new EventEmitter();
    this.regoForm = new FormControlService({
        email: {
            eventType: 'blur',
            validators: {
                required:true,
                emailValidation: true,
                async: (email) => {
                    return this.handleValidation('email', email);
                }
            }
        },
        password: {
            validators: {
                required:true,
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

    return this.registerService.validateInput(field, value)
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
    if (this.regoForm.invalid) return;
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

    this.registerService.createUser(this.regoForm.value)
        .then((res) => emit(true, res), (err) => emit(false, err));
};