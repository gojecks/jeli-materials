import { conditionParser$ } from '../utils';
import { FoTokenService } from './fo-auth-token.service';
import { AUTH_DATABASE_SERIVCE, FO_AUTH_CONFIG } from './tokens';

Service({
    DI: [
        FoTokenService,
        AUTH_DATABASE_SERIVCE,
    ]
})
export class FoAuthService {
    constructor(foTokenService, databaseService){
        this.foTokenService = foTokenService;
        this.databaseService = databaseService;
    }

    get userIsActive() {
        return this.foTokenService.isUserActive();
    }

    get userId() {
        return this.foTokenService.getPrincipal();
    }
    
    get userInfo(){
        return this.foTokenService.getUserInfo();
    }

    get authenticated(){
        return this.foTokenService.isAuthenticated;
    }

    hasAnyRole(roles) {
        return this.foTokenService.hasAnyAuthority(roles);
    }
    
    /**
     * check logged in authority
     * @param {*} force 
     * @param {*} afterLogin 
     * @returns 
     */
    checkAuthority(force, afterLogin) {
        var authAccount = () => {
            if (this.authenticated && !afterLogin) {
                var account = this.foTokenService.getUserInfo();
                if (account.forcePasswordReset) {
                    stateConstants.toState.redirect(FO_AUTH_CONFIG.passwordResetPage, {
                        state: 'password',
                        forceReset: true
                    });
                } else if (FO_AUTH_CONFIG.redirectOnPages.includes(stateConstants.toState.name)) {
                    stateConstants.toState.redirect(FO_AUTH_CONFIG.pageAfterLogin);
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
                    stateConstants.toState.redirect(FO_AUTH_CONFIG.loginPage);
                } else {
                    //  redirect to page or default if not found
                    var pageAfterLogin = this.determinePageAfterLogin();
                    stateConstants.toState.redirect(pageAfterLogin);
                }
            }
        };
    
        return this.identify(force).then(authAccount);
    };
    
    /**
     * destroy accessToken
     * @returns 
     */
    disconnect() {
        //log the user out from the server
        return this.databaseService.core.api('/user/session/destroy').then(() => this.foTokenService.destroy());
    }
    
    determinePageAfterLogin(){
        return conditionParser$.evaluateConditionalValue(FO_AUTH_CONFIG.pageAfterLogin, prop => this.foTokenService.authManager.getData(prop));
    }
    
    forcePasswordReset(){
        this.foTokenService.putUserInfo({
            forcePasswordReset: false
        });
    }

    identify(force) {
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
     * reAuthorize user when accessToken is expired
     * @param {*} refresh_token 
     * @returns 
     */
    reAuthorize() {
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
    info() {
        return this.databaseService.core.api('/user/info');
    };
}