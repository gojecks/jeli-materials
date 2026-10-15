import { EventEmitter } from '@jeli/core';
import { LoginService } from "../auth-login/login-service";
import { FoTokenService } from '../fo-auth-token.service';

const PROVIDER_ICONS = {
    google: 'google',
    github: 'github',
    microsoft: 'microsoft',
    facebook: 'facebook',
    instagram: 'instagram',
    linkedin: 'linkedin',
    twitter: 'twitter-x',
    apple: 'apple',
    oidc: 'shield-lock',
    dropbox: 'dropbox',
    aws: 'amazon'
};

const PROVIDER_LABELS = {
    google: 'Google',
    microsoft: 'Microsoft',
    apple: 'Apple',
    facebook: 'Facebook',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    twitter: 'X',
    oidc: 'Single sign-on'
};

Element({
    selector: 'fo-open-id',
    templateUrl: './open-id.element.html',
    styleUrl: './open-id.element.scss',
    DI: ['changeDetector?', LoginService, FoTokenService],
    props: [
        'openIds',
        'customClass',
        'divider',
        'nativeMode',
        'usePolicy:Boolean',
        'withClient:Any'
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
        this.usePolicy = true;
        this.withClient = null;
        this.policy = null;
        this._filtered = { source: null, list: null };
        this.pendingStep = null;
    }

    didInit() {
        if (!this.usePolicy) return;
        this.policy = LoginService.peekPolicy(this.withClient);
        this.loginService.getPolicy(this.withClient).then(policy => {
            this.policy = policy;
            if (this.changeDetector) this.changeDetector.detectChanges();
        });
    }

    get _openIds(){
        const ids = this.openIds || this._defaultIds;
        if (!this.policy) return ids;
        if (!this.policy.openid.enabled) return [];
        const allowed = this.policy.openid.providers;
        if (!allowed.length) return ids;
        // no host list: the policy decides which buttons to show
        if (!this.openIds) return allowed;
        if (this._filtered.source !== ids) {
            this._filtered = { source: ids, list: ids.filter(id => allowed.includes(id)) };
        }

        return this._filtered.list;
    }

    get eventData(){
        return this._eventData;
    }

    set eventData(value){
        this._eventData = value;
        if (value)
        this.onMessageListener(value.data);
    }

    handleAuthResult(res) {
        if (!res || typeof res.getTokens !== 'function') {
            return this.onOpenIdLogin.emit({ success: false, data: res });
        }

        const next = LoginService.nextStep(res);
        if (next) {
            this.pendingStep = next;
            if (this.changeDetector) this.changeDetector.detectChanges();
            return;
        }

        this.pendingStep = null;
        this.foTokenService.saveAuthentication(res);
        this.onOpenIdLogin.emit({
            success: !res.isDisabled(),
            reset: res.isPasswordReset()
        });
    }

    clearPendingStep() {
        this.pendingStep = null;
        if (this.changeDetector) this.changeDetector.detectChanges();
    }

    providerKey(id) {
        return id.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    providerLabel(id) {
        const labels = this.policy && this.policy.openid.labels;
        return (labels && labels[id]) || PROVIDER_LABELS[this.providerKey(id)] || id;
    }

    iconClass(id) {
        return 'bi-' + (PROVIDER_ICONS[this.providerKey(id)] || 'box-arrow-in-right');
    }

    authenticate(type) {
        const openIdURI = this.loginService.getOpenIdURI(type, this.withClient);
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
            this.loginService.getOidcToken(event, this.withClient)
                .then(res => this.handleAuthResult(res), (err) => {
                    this.onOpenIdLogin.emit({
                        success: false,
                        data: err
                    });
                });
        }
    }
}

