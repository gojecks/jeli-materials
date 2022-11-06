import { AuthIdentityService } from "./auth-identity.service";
import { stateConstants } from "./constants";


Service({
    DI: [AuthIdentityService]
})
export function AuthRouterInterceptorService(authIdentityService) {
    this.resolve = function(route, next) {
        stateConstants.currentNav = route.name;
        stateConstants.toState = route;
        authIdentityService.Authority().then(next);
    };
}