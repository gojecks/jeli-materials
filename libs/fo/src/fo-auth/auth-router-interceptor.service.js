import { FoAuthService } from "./fo-auth.service";


Service({
    DI: [FoAuthService]
})
export class AuthRouterInterceptorService {
    constructor(foAuthService) {
        this.foAuthService = foAuthService;
    }

    resolve(route, next) {
        this.foAuthService.checkAuthority(route).then(next);
    }
}