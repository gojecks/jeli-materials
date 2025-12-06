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
        'onTrigger:emitter'
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
        this.openIds = null;
    }

    get _openIds(){
        return this.openIds || this._defaultIds;
    }

    get eventData(){
        return this._eventData;
    }

    set eventData(value){
        this._eventData = value;
        if (value)
        this.onMessageListener(value.data);
    }

    authenticate(type) {
        const openIdURI = this.loginService.getOpenIdURI(type);
        if (!this.nativeMode) {
            this.loginService.pkce._performRedirection(openIdURI, true)
            .then(data => this.onMessageListener(data));
        } 

        this.onTrigger.emit({
            openIdURI,
            type
        });
    }

    onMessageListener(event) {
        if (event.message) {
            this.onOpenIdLogin.emit({
                success: false,
                data: event
            });
        } else {
            // retrieve the user token
            this.loginService.getOidcToken(event)
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

