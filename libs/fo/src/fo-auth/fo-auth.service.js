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
        this._refreshTimeout = null;
        // register token listener
        foTokenService.onTokenUpdate
        .subscribe(isSet => {
            clearTimeout(this._refreshTimeout);

            if (isSet){
                const accessToken = this.foTokenService.getAccessToken();
                if (accessToken){
                    // trigger refresh when is 1min to go
                    const diffInSecs = Math.round((new Date(accessToken.expires_at - (60000)) - Date.now()) / 1000);
                    if (diffInSecs > 1){
                        console.log(`[AuthService] setting timeout to reAuthorization in ${diffInSecs} seconds`);
                        this._refreshTimeout = setTimeout(() => this.reAuthorize(), diffInSecs * 1000);
                    }
                }
            }
        });

        // trigger the subscription
        foTokenService.onTokenUpdate.emit(foTokenService.isUserActive());
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
        return this.foTokenService.isAuthenticated && this.userId;
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
        return this.identify(false).then(() => {
            if (this.authenticated) {
                const account = this.foTokenService.getUserInfo();
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
                const isAuthorized = this.foTokenService.hasAnyAuthority(route.data.authorities);
                if (isAuthorized && (!route.data.authorities || this.authenticated)) return;
                const redirectPage = !this.authenticated ? FO_AUTH_CONFIG.loginPage : this.determinePageAfterLogin();
                route.redirect(redirectPage);
            }
        });
    }
    
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
            const currentSession = this.foTokenService.getAccessToken();
            const curTime = +new Date;
            const successAuth  = () => {
                this.foTokenService.init(true);
                resolve();
            };
        
            const failedAuth = () => {
                this.foTokenService.destroy();
                resolve();
            };

            const reAuthorize = () => {
                if (currentSession && curTime >= currentSession.expires_at &&  currentSession.refresh_token) {
                    this.reAuthorize().then(successAuth, failedAuth);
                } else {
                    successAuth()
                }
            };
            
            if (this.authenticated) {
                return resolve();
            } else if (currentSession) {
                return reAuthorize();
            }
            
            return failedAuth();
        });
    }
    
    /**
     * reAuthorize user when accessToken is expired
     * @param {*} refresh_token 
     * @returns 
     */
    reAuthorize() {
        const accessToken = this.foTokenService.getAccessToken();
        return this.databaseService.core?.api({
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