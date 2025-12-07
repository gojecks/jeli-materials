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
    props: ["buttonText", "data", 'lgView', 'spinner']
})
export class AuthRegisterElement {
    lgView = false;
    spinner = 'spinner-border spinner-border-sm';
    constructor(registerService, foTokenService, changeDetector) {
        /**
         * additional form to be rendered dynamically
         */
        this.additionalForm = null;
        this.registerService = registerService;
        this.foTokenService = foTokenService;
        this.changeDetector = changeDetector;
        this.isProcessing = false;
        this.errorMessage = null;
        this.onAuthRegister = new EventEmitter();
        this.regoForm = new FormControlService({
            email: {
                eventType: 'blur',
                validators: {
                    required: true,
                    emailValidation: true,
                    async: (email) => {
                        return this.handleValidation('email', email);
                    }
                }
            },
            password: {
                validators: {
                    required: true,
                    minLength: 8,
                    mediumPasswordStrength: true
                }
            }
        });
    }
    
    didInit(){
        if (this.data) {
            this.regoForm.patchValue( this.data );
        }
    }

    /**
     *
     * @param {*} field
     * @param {*} value
     * @returns
     */
    handleValidation(field, value) {
        if (!value) {
            return Promise.resolve(true);
        }

        return this.registerService.validateInput(field, value)
            .then(res => {
                this.changeDetector.detectChanges();
                return !res.isExists;
            });
    }
    isInvalidField(field) {
        var fieldControl = this.regoForm.getField(field);
        return fieldControl && fieldControl.touched && fieldControl.invalid;
    }
    /**
     * initialize the registration
     * validate user email before registering user
     * email exists triggers error
     */
    registerAccount() {
        if (this.regoForm.invalid) return;
        this.isProcessing = true;
        this.errorMessage = null;
        /**
         *
         * @param {*} state
         * @param {*} res
         */
        const emit = (state, res) => {
            this.isProcessing = false;
            if (state) {
                this.foTokenService.saveAuthentication(res);
                this.onAuthRegister.emit(true);
            } else {
                this.errorMessage = res.message;
            }

            this.changeDetector.detectChanges();
        };

        this.registerService.createUser(this.regoForm.value)
            .then((res) => emit(true, res), (err) => emit(false, err));
    }
}



