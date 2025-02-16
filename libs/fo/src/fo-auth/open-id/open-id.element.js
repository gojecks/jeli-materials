import { EventEmitter } from '@jeli/core';
import { LoginService } from "../auth-login/login-service";
import { FoTokenService } from '../fo-auth-token.service';

Element({
    selector: 'fo-open-id',
    templateUrl: './open-id.element.html',
    styleUrl: './open-id.element.scss',
    DI: ['changeDetector?', LoginService, FoTokenService],
    props: [
        'openIds',
        'customClass',
        'divider',
        'nativeMode'
    ],
    events: [
        "onOpenIdLogin:emitter",
        'onTrigger:emitter',
        "window.message:event=onMessageListener($event)"
    ]
})
export class OpenIdElement {
    constructor(changeDetector, loginService, foTokenService) {
        this.changeDetector = changeDetector;
        this.loginService = loginService;
        this.foTokenService = foTokenService;
        this.onOpenIdLogin = new EventEmitter();
        this.onTrigger = new EventEmitter();
        this.customClass = 'secondary';
        this._defaultIds = ['google', 'github', 'microsoft'];
        this.nativeMode = false;
        this._eventData = null;
        Object.defineProperty(this, '_openIds', {
            get: function () {
                return this.openIds || this._defaultIds;
            }
        });
    }

    get eventData(){
        return this._eventData;
    }

    set eventData(value){
        this._eventData = value;
        if (value)
        this.onMessageListener(value);
    }

    authenticate(type) {
        var openIdURI = this.loginService.getOpenIdURI(type);
        if (!this.nativeMode) {
            var auth_window = window.open(openIdURI, "ExternalAuthentication", "top=200,left=200,width=500,height=400,location=yes,status=yes,resizable=yes", true);
            auth_window.focus();
        } 

        this.onTrigger.emit({
            openIdURI,
            type
        });
    }

    onMessageListener(event) {
        this.openIdURI = null;
        if (!event.data || !event.data.code || !event.data.openid) return;
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
}

