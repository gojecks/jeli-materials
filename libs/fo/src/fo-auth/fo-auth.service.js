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

    isMe(uid){
        return (this.userId == uid);
    }
    
    /**
     * check logged in authority
     * @param {*} route
     * @returns 
     */
    checkAuthority(route) {
        var authAccount = () => {
            if (this.authenticated) {
                var account = this.foTokenService.getUserInfo();
                if (account.forcePasswordReset) {
                    return route.redirect(FO_AUTH_CONFIG.passwordResetPage, {
                        state: 'password',
                        forceReset: true
                    });
                } else if (FO_AUTH_CONFIG.redirectOnPages.includes(route.name)) {
                    return route.redirect(FO_AUTH_CONFIG.pageAfterLogin);
                }
            }
    
            if (route.data) {
                var isAuthorized = this.foTokenService.hasAnyAuthority(route.data.authorities);
                if (isAuthorized && (!route.data.authorities || this.authenticated)) return;
                var redirectPage = !this.authenticated ? FO_AUTH_CONFIG.loginPage : this.determinePageAfterLogin();
                route.redirect(redirectPage);
            }
        };
    
        return this.identify(false).then(authAccount);
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
        if (force){
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
    }

    getDevices(){
        return this.databaseService.core.api('/user/devices');
    }

    removeDevice(deviceId){
        return this.databaseService.core.api({path: '/user/device', method: 'DELETE', data: {deviceId}});
    }

    removeAllDevices(){
        return this.databaseService.core.api({path: '/user/devices', method: 'DELETE'});
    }
}