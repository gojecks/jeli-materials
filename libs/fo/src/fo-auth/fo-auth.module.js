import { CommonModule } from '@jeli/common';
import { ROUTE_INTERCEPTOR } from '@jeli/router';
import { FormModule } from '@jeli/form';
import { FoAuthService } from './fo-auth.service.js';
import { FO_AUTH_CONFIG } from './tokens.js';
import { OpenIdElement } from './open-id/open-id.element.js';
import { AuthLoginElement } from './auth-login/auth-login.element.js';
import { FoResetPasswordElement } from './auth-login/reset-password/reset-password-element.js';
import { FoNewPassword } from './auth-login/new-password/new-password.element.js';
import { FoTokenService } from './fo-auth-token.service.js';
import { SessionManagementElement } from './session-management/session-management.element.js';
import { FoModalModule } from '../modal/modal.module.js';
import { AuthSessionManager } from './auth.session.manager.js';
import { AuthRouterInterceptorService } from './auth-router-interceptor.service';
import { AuthRegisterElement } from './auth-register/auth-register.element.js';
import { FoPasswordTextSwitcherDirective } from './password-text-switcher.directive.js';
import { FoOtpElement } from './otp/otp.element.js';
import { FoDigitGroupElement } from './digit-group/digit-group.element.js';
import { FoAuthPkceService } from './fo-auth-pkce.service.js';


jModule({
    requiredModules: [
        CommonModule,
        FormModule,
        FoModalModule
    ],
    selectors: [
        OpenIdElement,
        AuthLoginElement,
        FoResetPasswordElement,
        FoNewPassword,
        SessionManagementElement,
        AuthRegisterElement,
        FoPasswordTextSwitcherDirective,
        FoOtpElement,
        FoDigitGroupElement
    ],
    services: [
        FoAuthService,
        FoTokenService,
        AuthSessionManager,
        FoAuthPkceService,
        {
            name: ROUTE_INTERCEPTOR,
            useClass: AuthRouterInterceptorService
        }
    ]
})
export function FoAuthModule() {}
FoAuthModule.setConfig = function(config) {
    Object.assign(FO_AUTH_CONFIG, config);
}