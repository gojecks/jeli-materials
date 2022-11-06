import { WebStateService } from '@jeli/router';
import { AuthIdentityService } from './auth-identity.service';
import { FoTokenService } from './fo-auth-token.service';

Service({
    DI: [
        WebStateService,
        FoTokenService,
        AuthIdentityService
    ]
})
export function FoAuthService(webStateService, foTokenService, authIdentityService) {
    this.foTokenService = foTokenService;
    this.webStateService = webStateService;
    this.authIdentityService = authIdentityService;

    Object.defineProperties(this, {
        userIsActive: {
            get: function() {
                return foTokenService.isUserActive();
            }
        },
        userId: {
            get: function() {
                return foTokenService.getPrincipal();
            }
        },
        userInfo: {
            get: function() {
                return foTokenService.getUserInfo();
            }
        }
    });
}

FoAuthService.prototype.hasAnyRole = function(roles) {
    return this.foTokenService.hasAnyAuthority(roles);
}


FoAuthService.prototype.checkAuthority = function(force) {
    this.authIdentityService.Authority(force);
};

FoAuthService.prototype.disconnect = function() {
    var _this = this;
    //log the user out from the server
    return this.authIdentityService.destroy().then(function() {
        _this.foTokenService.destroy();
    });
};

FoAuthService.prototype.getToken = function(data) {
    var _this = this;
    return new Promise(function(resolve, reject) {
        this.authIdentityService.getToken(data)
            .then(function(res) {
                _this.foTokenService.saveAuthentication(res);
                resolve();
            }, reject);
    });
};