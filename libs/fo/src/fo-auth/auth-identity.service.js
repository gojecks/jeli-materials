import { stateConstants } from './constants';
import { WebStateService } from '@jeli/router';
import { AUTH_DATABASE_SERIVCE, FO_AUTH_CONFIG } from './tokens';
import { FoTokenService } from './fo-auth-token.service';

Service({
    DI: [
        FoTokenService,
        AUTH_DATABASE_SERIVCE,
        WebStateService
    ]
})
export function AuthIdentityService(foTokenService, databaseService, webStateService) {
    this.foTokenService = foTokenService;
    this.databaseService = databaseService;
    this.webStateService = webStateService;
    Object.defineProperty(this, 'authenticated', {
        get: () => foTokenService.isAuthenticated
    });
}

AuthIdentityService.prototype.identify = function(force) {
    if (force) {
        this.foTokenService.init(false);
    }

    return new Promise((resolve) => {
        var currentSession = this.foTokenService.getAccessToken();
        var curTime = +new Date;
        var reAuthorize = () => {
            if (currentSession && curTime >= currentSession.expires_at &&  currentSession.refresh_token) {
                this.reAuthorize().then(successAuth, failedAuth);
            } else {
                successAuth()
            }
        };
    
        var successAuth  = () => {
            this.foTokenService.init(true);
            resolve();
        };
    
        var failedAuth = () => {
            this.foTokenService.destroy();
            resolve();
        };
        
        if (this.authenticated) {
            return resolve();
        } else if (currentSession) {
            return reAuthorize();
        }
        
        return failedAuth();
    });
};

/**
 * check logged in authority
 * @param {*} force 
 * @param {*} afterLogin 
 * @returns 
 */
AuthIdentityService.prototype.Authority = function(force, afterLogin) {
    var authAccount = () => {
        if (this.authenticated && !afterLogin) {
            var account = this.foTokenService.getUserInfo();
            if (account.forcePasswordReset) {
                this.webStateService.go(FO_AUTH_CONFIG.passwordResetPage, {
                    state: 'password',
                    forceReset: true
                });
            } else if (FO_AUTH_CONFIG.redirectOnPages.includes(stateConstants.toState.name)) {
                this.webStateService.go(FO_AUTH_CONFIG.pageAfterLogin);
            }
        }

        if (stateConstants.toState && stateConstants.toState.data) {
            var isAuthorized = this.foTokenService.hasAnyAuthority(stateConstants.toState.data.authorities);
            if (isAuthorized && (!stateConstants.toState.data.authorities || this.authenticated)) return;
            if (!this.authenticated) {
                // user is not authenticated. stow the state they wanted before you
                // send them to the login service, so you can return them when you're done
                stateConstants.redirected = true;
                stateConstants.previousStateName = stateConstants.toState;
                stateConstants.previousStateNameParams = stateConstants.toStateParams;
                // now, send them to the signin state so they can log in
                this.webStateService.go(FO_AUTH_CONFIG.loginPage);
            } else {
                //  redirect to page or default if not found
                this.webStateService.go(FO_AUTH_CONFIG.pageAfterLogin);
            }
        }
    };

    return this.identify(force).then(authAccount);
}

/**
 * destroy accessToken
 * @returns 
 */
AuthIdentityService.prototype.destroy = function() {
    return this.databaseService.core.api('/logout');
};

/**
 * reAuthorize user when accessToken is expired
 * @param {*} refresh_token 
 * @returns 
 */
AuthIdentityService.prototype.reAuthorize = function() {
    var accessToken = this.foTokenService.getAccessToken();
    return this.databaseService.core.api({
            path: '/user/reauthorize',
            data: {
                'refresh_token': accessToken.refresh_token
            }
        })
        .then(ret => this.foTokenService.setAccessToken(ret.result.tokens));
}

/***
 * get logged in users info
 */
AuthIdentityService.prototype.info = function() {
    return this.databaseService.core.api('/user/info');
};