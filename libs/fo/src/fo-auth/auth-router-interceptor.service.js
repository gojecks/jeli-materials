import { stateConstants } from "./constants";
import { FoAuthService } from "./fo-auth.service";


Service({
    DI: [FoAuthService]
})
export function AuthRouterInterceptorService(foAuthService) {
    this.resolve = function(route, next) {
        stateConstants.currentNav = route.name;
        stateConstants.toState = route;
        foAuthService.checkAuthority().then(next);
    };
}