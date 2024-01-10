import { FoAuthService } from "../fo-auth.service";
import { EventEmitter } from '@jeli/core';
import { LoginService } from "../auth-login/login-service";

Element({
    selector: 'fo-open-id',
    templateUrl: './open-id.element.html',
    styleUrl: './open-id.element.scss',
    DI: ['changeDetector?', FoAuthService, LoginService],
    props: ['openIds', 'customClass', 'divider'],
    events: [
        "onOpenIdLogin:emitter",
        "window.message:event=onMessageListener($event)"
    ]
})
export function OpenIdElement(changeDetector, authService, loginService) {
    this.changeDetector = changeDetector;
    this.loginService = loginService;
    this.authService = authService;
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
        // retrieve the token and log user in
        this.authService.getToken(event.data)
            .then(() => {
                this.onOpenIdLogin.emit({
                    success: true
                });
            }, (err) => {
                this.onOpenIdLogin.emit({
                    success: false,
                    data: err
                });
            });
    }
}