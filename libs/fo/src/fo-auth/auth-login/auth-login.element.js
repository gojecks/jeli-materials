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
    this.onLoginEvent = new EventEmitter();
    this.errorLogin = false;
    this.isProcessing = false;
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
    var _this = this;
    this.errorLogin = false;
    this.isProcessing = true;
    this.loginService
        .authorizeUser(this.loginForm.value)
        .then(success, onLoginError);

    function onLoginError(err) {
        _this.errorLogin = true;
        _this.errMsg = (err || {}).message;
        _this.isProcessing = false;
        _this.onLoginEvent.emit({
            success: false,
            data: (err || {})
        });
    }

    function success(res) {
        _this.isProcessing = false;
        //set the authorities
        _this.foTokenService.saveAuthentication((res.result || res));
        _this.onLoginEvent.emit({
            success: true
        });
    }
};