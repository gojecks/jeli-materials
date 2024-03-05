import { AuthIdentityService } from './auth-identity.service';
import { FoTokenService } from './fo-auth-token.service';

Service({
    DI: [
        FoTokenService,
        AuthIdentityService
    ]
})
export function FoAuthService(foTokenService, authIdentityService) {
    this.foTokenService = foTokenService;
    this.authIdentityService = authIdentityService;

    Object.defineProperties(this, {
        userIsActive: {
            get: function () {
                return foTokenService.isUserActive();
            }
        },
        userId: {
            get: function () {
                return foTokenService.getPrincipal();
            }
        },
        userInfo: {
            get: function () {
                return foTokenService.getUserInfo();
            }
        }
    });
}

FoAuthService.prototype.hasAnyRole = function (roles) {
    return this.foTokenService.hasAnyAuthority(roles);
}


FoAuthService.prototype.checkAuthority = function (force) {
    this.authIdentityService.Authority(force);
};

FoAuthService.prototype.disconnect = function () {
    //log the user out from the server
    return this.authIdentityService.destroy().then(() => this.foTokenService.destroy());
}