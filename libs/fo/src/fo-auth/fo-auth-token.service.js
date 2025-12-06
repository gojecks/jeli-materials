import { AuthSessionManager } from "./auth.session.manager";
import { EventEmitter } from '@jeli/core';
/**
 * Token static values
 */
const IDENTIFIERS = {
    ACCESS_TOKEN: 'accessToken',
    USER_ACTIVE: "userIsActive",
    USER_ID: 'userId',
    USER_INFO: 'userInfo',
    PASSWORD_RESET: 'passwordReset'
} 


Service({
    DI: [AuthSessionManager]
})
export class FoTokenService {
    constructor(authManager) {
        this.authManager = authManager;
        this._authenticated = false;
        this.onTokenUpdate = new EventEmitter();
    }

    get isAuthenticated(){
        return this._authenticated;
    }

    get isPasswordReset(){
        return !!this.authManager.getData('passwordReset');
    }

    init(isAuthenticated) {
        this._authenticated = isAuthenticated == undefined ? true : isAuthenticated;
    }

    decodeToken(token) {
        token = token || this.getAccessToken();
        return token ? JSON.parse(atob((token.bearer || token.accessToken || '').split('.')[1])) : null;
    }
    
    getClaims(token) {
        var claims = this.decodeToken(token);
        return claim => claims ? claims[claim] : null;
    }

    saveAuthentication(response) {
        const tokens = response.getTokens();
        if (tokens) {
            this.setAccessToken(tokens);
            this.authManager.storeData(IDENTIFIERS.USER_ACTIVE, !response.isPasswordReset(), true);
            this.authManager.storeData(IDENTIFIERS.USER_ID, response.getUserId(), true);
            this.authManager.storeData(IDENTIFIERS.PASSWORD_RESET, response.isPasswordReset(), true);
            this.putUserInfo(response.getUserInfo());
        }
    }

    putUserInfo(userInfo) {
        if (userInfo) {
            const currentUserInfo = this.authManager.getData(IDENTIFIERS.USER_INFO) || {};
            this.authManager.storeData(IDENTIFIERS.USER_INFO, Object.assign(currentUserInfo, userInfo), true);
        }
    }
    /**
     *
     * @param {*} name
     * @param {*} value
     * @returns
     */
    setSessionData(name, value) {
        return this.authManager.storeData(name, value);
    }
    getSessionData(name) {
        return this.authManager.getData(name, true);
    }
    setAccessToken(value) {
        this.authManager.storeData(IDENTIFIERS.ACCESS_TOKEN, value, true);
        this.onTokenUpdate.emit(true);
    }
    getAccessToken() {
        return this.authManager.getData(IDENTIFIERS.ACCESS_TOKEN);
    }
    getPrincipal() {
        return this.authManager.getData(IDENTIFIERS.USER_ID);
    }
    getUserInfo() {
        return (this.authManager.getData(IDENTIFIERS.USER_INFO) || { ROLES: ['USER_EMPTY', 'ROLE_EMPTY'] });
    }
    getUserRoles() {
        const userInfo = this.getUserInfo();
        return userInfo && userInfo.ROLES;
    }
    
    isUserActive() {
        return (this.authManager.getData(IDENTIFIERS.USER_ACTIVE) || false);
    }

    destroy() {
        this._authenticated = false;
        this.authManager.destroy(Object.values(IDENTIFIERS));
        this.onTokenUpdate.emit(false);
    }

    hasAuthority(role) {
        const userRoles = this.getUserRoles();
        if (!role && !userRoles) return true;
        return userRoles && userRoles.includes(role);
    }

    hasAnyAuthority(authorities) {
        // no role check required
        if (!authorities) return true;
        if (!Array.isArray(authorities)) return this.hasAuthority(authorities);
        const userRoles = this.getUserRoles();
        // no userRoles and authorities check is not empty
        if ((!userRoles && authorities.length) || (userRoles && !authorities.length)) return false;
        return authorities.some((authority) => userRoles.includes(authority));
    }
}