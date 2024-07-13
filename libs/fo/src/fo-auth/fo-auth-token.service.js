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
export function FoTokenService(authManager) {
    this.authManager = authManager;
    this._authenticated = false;
    this.onTokenUpdate = new EventEmitter();
    this.init = function(isAuthenticated) {
        this._authenticated = isAuthenticated == undefined ? true : isAuthenticated;
    };

    Object.defineProperties(this, {
        isAuthenticated: {
            get: () => this._authenticated
        }
    });
}

FoTokenService.prototype.decodeToken = function(){
    var token =  this.getAccessToken();
    return token ? JSON.parse(atob((token.bearer || '').split('.')[1])) : null;
}

FoTokenService.prototype.getClaims =  function(){
    var claims = this.decodeToken();
    return function(claim){
        return claims ? claims[claim] : null;
    };
}

FoTokenService.prototype.saveAuthentication = function(response) {
    var tokens = response.getTokens();
    if (tokens) {
        this.setAccessToken(tokens);
        this.authManager.storeData(USER_ACTIVE, true, true);
        this.authManager.storeData(USER_ID, response.getUserId(), true);
        this.putUserInfo(response.getUserInfo());
    }

    tokens = null;
};

FoTokenService.prototype.putUserInfo = function(userInfo) {
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
FoTokenService.prototype.setSessionData = function(name, value) {
    return this.authManager.storeData(name, value);
}

FoTokenService.prototype.getSessionData = function(name) {
    return this.authManager.getData(name, true);
}

FoTokenService.prototype.setAccessToken = function(value) {
    this.authManager.storeData(ACCESS_TOKEN, value, true);
    this.onTokenUpdate.emit(true);
}

FoTokenService.prototype.getAccessToken = function() {
    return this.authManager.getData(ACCESS_TOKEN);
};

FoTokenService.prototype.getPrincipal = function() {
    return this.authManager.getData(USER_ID);
}

FoTokenService.prototype.getUserInfo = function() {
    return (this.authManager.getData(USER_INFO) || { ROLES: ["USER_EMPTY", 'ROLE_EMPTY'] });
};

FoTokenService.prototype.getUserRoles = function() {
    var userInfo = this.getUserInfo();
    return userInfo && userInfo.ROLES;
}

FoTokenService.prototype.isUserActive = function() {
    return (this.authManager.getData(USER_ACTIVE) || false);
}

FoTokenService.prototype.destroy = function() {
    if (this._authenticated) {
        this._authenticated = false;
        this.authManager.destroy();
    }
}

FoTokenService.prototype.hasAuthority = function(role) {
    var userRoles = this.getUserRoles();
    if (!role && !userRoles) return true;
    return userRoles && userRoles.includes(role);
};

FoTokenService.prototype.hasAnyAuthority = function(authorities) {
    // no role check required
    if (!authorities) return true;
    if (!Array.isArray(authorities)) return this.hasAuthority(authorities);
    var userRoles = this.getUserRoles();
    // no userRoles and authorities check is not empty
    if ((!userRoles && authorities.length) || (userRoles && !authorities.length)) return false;
    return authorities.some(function(authority) { return userRoles.includes(authority); });
}