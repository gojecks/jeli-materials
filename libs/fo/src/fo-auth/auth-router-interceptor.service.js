import { FoAuthService } from "./fo-auth.service";


Service({
    DI: [FoAuthService]
})
export function AuthRouterInterceptorService(foAuthService) {
    this.resolve = function(route, next) {
        foAuthService.checkAuthority(route).then(next);
    };
}