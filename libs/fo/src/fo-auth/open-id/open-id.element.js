import { EventEmitter } from '@jeli/core';
import { LoginService } from "../auth-login/login-service";
import { FoTokenService } from '../fo-auth-token.service';

Element({
    selector: 'fo-open-id',
    templateUrl: './open-id.element.html',
    styleUrl: './open-id.element.scss',
    DI: ['changeDetector?', LoginService, FoTokenService],
    props: ['openIds', 'customClass', 'divider'],
    events: [
        "onOpenIdLogin:emitter",
        "window.message:event=onMessageListener($event)"
    ]
})
export function OpenIdElement(changeDetector, loginService, foTokenService) {
    this.changeDetector = changeDetector;
    this.loginService = loginService;
    this.foTokenService = foTokenService;
    this.onOpenIdLogin = new EventEmitter();
    this.customClass = 'secondary';
    this._defaultIds = ['google', 'github', 'microsoft'];
    Object.defineProperty(this, '_openIds', {
        get: function() {
            return this.openIds || this._defaultIds;
        }
    });
}

OpenIdElement.prototype.onMessageListener = function(event) {
    if (!event.data) return;
    if (event.data.message) {
        this.onOpenIdLogin.emit({
            success: false,
            data: event.data
        });
    } else {
        // retrieve the user token
        this.loginService.getOidcToken(event.data)
            .then(res => {
                this.foTokenService.saveAuthentication(res);
                this.onOpenIdLogin.emit({
                    success: !res.isDisabled(),
                    reset: res.isPasswordReset()
                });
            }, (err) => {
                this.onOpenIdLogin.emit({
                    success: false,
                    data: err
                });
            });
    }
}