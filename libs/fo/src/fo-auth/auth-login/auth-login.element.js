import { AUTH_DATABASE_SERIVCE } from "../tokens";
import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';
import { LoginService } from "./login-service";
import { FoTokenService } from "../fo-auth-token.service";

Element({
    selector: 'fo-login',
    templateUrl: './auth-login.element.html',
    styleUrl: './auth-login.element.scss',
    DI: [AUTH_DATABASE_SERIVCE, FoTokenService, LoginService, 'HostElement?', 'changeDetector?'],
    events: [
        'onLoginEvent:emitter'
    ],
    props: ['lgView:Boolean', 'spinner:String', 'withClient:Any', 'mode:String', 'checkEmail:Boolean', 'usePolicy:Boolean']
})
export class AuthLoginElement {
    lgView = false;
    spinner = 'spinner-border spinner-border-sm';
    withClient = null;
    // 'single' | 'email-first'; overrides the app's sign-in policy flow when set
    mode = null;
    // email-first only: verify the account exists before asking for password; null = the app's sign-in policy
    checkEmail = null;
    usePolicy = true;
    policy = null;
    constructor(databaseService, foTokenService, loginService, hostElement, changeDetector) {
        this.databaseService = databaseService;
        this.foTokenService = foTokenService;
        this.loginService = loginService;
        this.hostElement = hostElement;
        this.changeDetector = changeDetector;
        this.step = 'email';
        // null = the default view for the policy (password, else emailed code)
        this.view = null;
        this.infoMsg = '';
        // 'email' | 'sms'
        this.otpChannel = 'email';
        // fo-otp talks to the sign-in code routes through this
        this.signInCodeProvider = {
            send: (identifier, type) => this.loginService.sendSignInCode(type === 'sms' ? { phone: identifier } : identifier, this.withClient),
            resend: identifier => this.loginService.resendSignInCode(identifier, this.withClient),
            verify: (identifier, code) => this.loginService.verifySignInCode(identifier, code, this.withClient),
            resendAfter: 30,
            sentMessage: destination => `If an account exists for ${destination}, a sign-in code is on its way. It expires in 15 minutes.`
        };
        this.pendingStep = null;
        // policy failed to load and a sign-in was then refused: offer a retry
        this.showPolicyRetry = false;
        this.isSupportCredentials = !!navigator.credentials;
        this.onLoginEvent = new EventEmitter();
        this.errorLogin = false;
        this.isProcessing = false;
        this.isPasswordVisible = false;
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
    didInit() {
        if (!this.usePolicy) return;
        this.applyPolicy(LoginService.peekPolicy(this.withClient));
        this.loginService.getPolicy(this.withClient).then(policy => {
            this.applyPolicy(policy);
            if (this.changeDetector) this.changeDetector.detectChanges();
        });
    }

    retryPolicy() {
        this.showPolicyRetry = false;
        this.loginService.getPolicy(this.withClient).then(policy => {
            this.applyPolicy(policy);
            if (!policy) this.showPolicyRetry = LoginService.policyLoadFailed(this.withClient);
            else this.errorLogin = false;
            this.detectChanges();
        });
    }

    applyPolicy(policy) {
        this.policy = policy;
        if (!this.isEmailCodeEnabled && this.isSmsCodeEnabled) this.otpChannel = 'sms';
    }

    get isPasswordEnabled() {
        return !this.policy || this.policy.password.enabled;
    }

    get isOtpEnabled() {
        return this.isEmailCodeEnabled || this.isSmsCodeEnabled;
    }

    // a policy without channels predates SMS codes: email only
    get otpChannels() {
        const otp = this.policy && this.policy.otp;
        if (!otp || !otp.enabled) return [];
        return otp.channels || ['email'];
    }

    get isEmailCodeEnabled() {
        return this.otpChannels.includes('email');
    }

    get isSmsCodeEnabled() {
        return this.otpChannels.includes('sms');
    }

    get activeView() {
        if (this.view) return this.view;
        if (this.isPasswordEnabled) return 'password';
        return this.isOtpEnabled ? 'otp' : 'none';
    }

    // password, emailed-code and second-factor results all land here
    handleAuthResult(res) {
        this.isProcessing = false;
        if (!res || typeof res.getTokens !== 'function') {
            this.errorLogin = true;
            this.errMsg = (res || {}).message;
            this.detectChanges();
            return;
        }

        const next = LoginService.nextStep(res);
        if (next) {
            this.pendingStep = next;
            this.view = 'second-factor';
            this.detectChanges();
            return;
        }

        this.foTokenService.saveAuthentication(res);
        this.onLoginEvent.emit({
            success: !res.isDisabled(),
            reset: res.isPasswordReset(),
            // required 2FA still in its grace period: when setup becomes mandatory (seconds), so the app can nudge
            mfaSetupDueAt: typeof res.getMfaSetupDueAt === 'function' ? res.getMfaSetupDueAt() : null
        });
    }

    useOtp(channel) {
        this.otpChannel = channel || this.otpChannel;
        if (!this.otpChannels.includes(this.otpChannel)) this.otpChannel = this.otpChannels[0] || 'email';
        this.view = 'otp';
        this.infoMsg = '';
        this.errorLogin = false;
        this.detectChanges();
    }

    onCodeVerified(event) {
        this.handleAuthResult(event.result);
    }

    usePassword() {
        this.view = 'password';
        this.focusField('email');
    }

    backToStart() {
        this.view = null;
        this.pendingStep = null;
        this.step = 'email';
        this.loginForm.getField('password').reset();
        this.detectChanges();
    }

    onSecondFactorSetupDone() {
        this.backToStart();
        this.infoMsg = 'Two-step verification is set up. Sign in again to continue.';
    }

    detectChanges() {
        if (this.changeDetector) this.changeDetector.detectChanges();
    }

    get isAccountCheckOn() {
        return (this.checkEmail !== null && this.checkEmail !== undefined) ? !!this.checkEmail : !!(this.policy && this.policy.checkEmail);
    }

    get isEmailFirst() {
        return (this.mode || (this.policy && this.policy.flow)) === 'email-first';
    }

    get isEmailStep() {
        return this.isEmailFirst && this.step === 'email';
    }

    get isSubmitDisabled() {
        return this.isProcessing || (this.isEmailStep ? this.loginForm.getField('email').invalid : this.loginForm.invalid);
    }

    onSubmit() {
        if (!this.isEmailStep) return this.login();
        if (this.loginForm.getField('email').invalid) return;
        if (!this.isAccountCheckOn) return this.goToPasswordStep();

        const email = this.loginForm.value.email;
        this.errorLogin = false;
        this.isProcessing = true;
        const onCheckError = err => {
            this.isProcessing = false;
            this.errorLogin = true;
            this.errMsg = (err || {}).message || 'Unable to verify email, please try again';
            this.detectChanges();
        };

        this.loginService.validateInput('email', email, this.withClient)
            .then(res => {
                if (!res || typeof res.isExists !== 'boolean') return onCheckError(res);
                this.isProcessing = false;
                if (res.isExists) return this.goToPasswordStep();
                this.errorLogin = true;
                this.errMsg = 'No account found for this email';
                this.detectChanges();
                this.onLoginEvent.emit({ success: false, accountNotFound: true, email });
            }, onCheckError);
    }

    goToPasswordStep() {
        this.step = 'password';
        this.detectChanges();
        this.focusField('password');
    }

    changeEmail() {
        this.step = 'email';
        this.errorLogin = false;
        this.loginForm.getField('password').reset();
        this.focusField('email');
    }

    focusField(name) {
        if (!this.hostElement) return;
        setTimeout(() => {
            const input = this.hostElement.nativeElement.querySelector(`input[name="${name}"]`);
            if (input) input.focus();
        });
    }

    login() {
        this.errorLogin = false;
        this.isProcessing = true;
        const success = res => {
            res = res && res.result ? res.result : res;
            // userServices.authorize() resolves request failures instead of rejecting
            if (!res || typeof res.getTokens !== 'function') return onLoginError(res);
            this.handleAuthResult(res);
        };

        var onLoginError = err => {
            this.errorLogin = true;
            this.errMsg = (err || {}).message;
            this.isProcessing = false;
            this.showPolicyRetry = this.usePolicy && !this.policy && LoginService.policyLoadFailed(this.withClient);
            this.onLoginEvent.emit({
                success: false,
                data: (err || {}),
                reset: (err || {}).forcePasswordReset,
                email: this.loginForm.value.email
            });
        };

        this.loginService
            .authorizeUser(this.loginForm.value, this.withClient)
            .then(success, onLoginError);
    }
}

