import { AuthSessionManager } from "./auth.session.manager";
import { EventEmitter } from '@jeli/core';
/**
 * Token static values
 */
var ACCESS_TOKEN = 'accessToken';
var USER_ACTIVE = "userIsActive";
var USER_ID = 'userId';
var USER_INFO = 'userInfo';

Service({
    DI: [AuthSessionManager]
})
export class FoTokenService {
    constructor(authManager) {
        this.authManager = authManager;
        this._authenticated = false;
        this.onTokenUpdate = new EventEmitter();
        this.init = function (isAuthenticated) {
            this._authenticated = isAuthenticated == undefined ? true : isAuthenticated;
        };

        Object.defineProperties(this, {
            isAuthenticated: {
                get: () => this._authenticated
            }
        });
    }
    decodeToken() {
        var token = this.getAccessToken();
        return token ? JSON.parse(atob((token.bearer || '').split('.')[1])) : null;
    }
    getClaims() {
        var claims = this.decodeToken();
        return function (claim) {
            return claims ? claims[claim] : null;
        };
    }
    saveAuthentication(response) {
        var tokens = response.getTokens();
        if (tokens) {
            this.setAccessToken(tokens);
            this.authManager.storeData(USER_ACTIVE, true, true);
            this.authManager.storeData(USER_ID, response.getUserId(), true);
            this.putUserInfo(response.getUserInfo());
        }

        tokens = null;
    }
    putUserInfo(userInfo) {
        if (userInfo) {
            var currentUserInfo = this.authManager.getData(USER_INFO) || {};
            this.authManager.storeData(USER_INFO, Object.assign(currentUserInfo, userInfo), true);
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
        this.authManager.storeData(ACCESS_TOKEN, value, true);
        this.onTokenUpdate.emit(true);
    }
    getAccessToken() {
        return this.authManager.getData(ACCESS_TOKEN);
    }
    getPrincipal() {
        return this.authManager.getData(USER_ID);
    }
    getUserInfo() {
        return (this.authManager.getData(USER_INFO) || { ROLES: ["USER_EMPTY", 'ROLE_EMPTY'] });
    }
    getUserRoles() {
        var userInfo = this.getUserInfo();
        return userInfo && userInfo.ROLES;
    }
    isUserActive() {
        return (this.authManager.getData(USER_ACTIVE) || false);
    }
    destroy() {
        this._authenticated = false;
        this.authManager.destroy([USER_INFO, USER_ACTIVE, USER_ID, ACCESS_TOKEN]);
    }
    hasAuthority(role) {
        var userRoles = this.getUserRoles();
        if (!role && !userRoles) return true;
        return userRoles && userRoles.includes(role);
    }
    hasAnyAuthority(authorities) {
        // no role check required
        if (!authorities) return true;
        if (!Array.isArray(authorities)) return this.hasAuthority(authorities);
        var userRoles = this.getUserRoles();
        // no userRoles and authorities check is not empty
        if ((!userRoles && authorities.length) || (userRoles && !authorities.length)) return false;
        return authorities.some(function (authority) { return userRoles.includes(authority); });
    }
}