import { AUTH_DATABASE_SERIVCE } from "../tokens";
import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';
import { LoginService } from "./login-service";
import { FoTokenService } from "../fo-auth-token.service";

Element({
    selector: 'fo-login',
    templateUrl: './auth-login.element.html',
    styleUrl: './auth-login.element.scss',
    DI: [AUTH_DATABASE_SERIVCE, FoTokenService, LoginService],
    events: [
        'onLoginEvent:emitter'
    ]
})
export function AuthLoginElement(databaseService, foTokenService, loginService) {
    this.databaseService = databaseService;
    this.foTokenService = foTokenService;
    this.loginService = loginService;
    this.isSupportCredentials = !!navigator.credentials;
    this.onLoginEvent = new EventEmitter();
    this.errorLogin = false;
    this.isProcessing = false;
    this.isPasswordVisible  = false;
    this.loginForm = new FormControlService({
        email: {
            validators: {
                required: true,
                emailValidation: true
            }
        },
        password: {
            validators: {
                required: true,
                minLength: 6
            }
        }
    });
}

AuthLoginElement.prototype.login = function() {
    this.errorLogin = false;
    this.isProcessing = true;
    var success = res  => {
        this.isProcessing = false;
        res = (res.result || res);
        //set the authorities
        this.foTokenService.saveAuthentication(res);
        this.onLoginEvent.emit({
            success: !res.disabled,
            reset: res.forcePasswordReset || false
        });
    };

    var onLoginError = err => {
        this.errorLogin = true;
        this.errMsg = (err || {}).message;
        this.isProcessing = false;
        this.onLoginEvent.emit({
            success: false,
            data: (err || {}),
            reset: err.forcePasswordReset || false,
            email: this.loginForm.value.email
        });
    };

    this.loginService
        .authorizeUser(this.loginForm.value)
        .then(success, onLoginError);
};