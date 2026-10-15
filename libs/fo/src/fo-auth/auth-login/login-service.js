import { FoAuthPkceService } from "../fo-auth-pkce.service";
import { AUTH_DATABASE_SERIVCE, FO_AUTH_CONFIG } from "../tokens";

const policyCache = new Map();
// resolved policies, so a component created again (e.g. back from "forgot password") renders with it straight away
const resolvedPolicies = new Map();
// clients whose last policy request failed (as opposed to returning no policy)
const failedPolicies = new Set();
const policyKey = client => client ? `${client.organisation}/${client.application}` : '';
const DEVICE_TOKEN_KEY = 'fo-trusted-device:';
// a custom $ajax may resolve failed requests with the error object instead of rejecting
const unwrap = res => (res && res.status === 'success') ? res.result : Promise.reject(res || {});


Service({
    DI: [AUTH_DATABASE_SERIVCE, FoAuthPkceService]
})
export class LoginService {
    constructor(databaseService, foAuthPkceService) {
        this.pkce = foAuthPkceService;
        this.databaseService = databaseService;
    }
    validateAndSendEmail(requestBody) {
        return this.databaseService.userServices.password.forgot(requestBody);
    }
    resendCode(identifier) {
        return this.databaseService.userServices.password.resendCode(identifier);
    }
    validateCode(requestBody) {
        return this.databaseService.userServices.password.validateCode(requestBody);
    }

    /**
     * App sign-in policy, cached per client; resolves null when unavailable so callers keep their defaults
     */
    getPolicy(client = null) {
        const key = policyKey(client);
        if (!policyCache.has(key)) {
            // every component subscribes to this one cached promise
            const request = Promise.resolve(this.databaseService.core.api({ path: '/user/auth/policy', method: 'GET', withClient: client }))
                .then(res => (res && (res.result || res)) || null, () => {
                    failedPolicies.add(key);
                    return null;
                })
                .then(policy => {
                    if (!policy || !policy.password) {
                        policyCache.delete(key);
                        return null;
                    }
                    failedPolicies.delete(key);
                    resolvedPolicies.set(key, policy);
                    return policy;
                });
            policyCache.set(key, request);
        }

        return policyCache.get(key);
    }

    static policyLoadFailed(client = null) {
        return failedPolicies.has(policyKey(client));
    }

    // the policy already loaded for this client, or null
    static peekPolicy(client = null) {
        return resolvedPolicies.get(policyKey(client)) || null;
    }

    // destination: an email string, or { phone } to text the code
    sendSignInCode(destination, client = null) {
        const data = typeof destination === 'string' ? { email: destination } : destination;
        return this.databaseService.core.api({ path: '/user/auth/otp', method: 'POST', data, withClient: client }).then(unwrap);
    }

    resendSignInCode(identifier, client = null) {
        return this.databaseService.core.api({ path: '/user/auth/otp/resend', method: 'POST', data: { identifier }, withClient: client }).then(unwrap);
    }

    verifySignInCode(identifier, code, client = null) {
        return this.databaseService.core.api({ path: '/user/auth/otp/verify', method: 'POST', data: { identifier, code }, withClient: client })
            .then(unwrap)
            .then(result => this.databaseService.userServices.createAuthorizeInstance(result));
    }

    // options: { rememberDevice } with a code, or { deviceToken } instead of a code
    verifySecondFactor(challengeId, code, client = null, options = {}) {
        const data = Object.assign({ challenge_id: challengeId }, options.deviceToken ? { deviceToken: options.deviceToken } : { code, rememberDevice: !!options.rememberDevice });
        return this.databaseService.core.api({ path: '/user/authorize/mfa', method: 'POST', data, withClient: client })
            .then(unwrap)
            .then(result => {
                if (result && result.deviceToken) LoginService.saveDeviceToken(client, result.deviceToken);
                return this.databaseService.userServices.createAuthorizeInstance(result);
            });
    }

    // one trusted-device token per app in this browser
    static deviceTokenKey(client) {
        const app = client ? `${client.organisation}/${client.application}` : `${FO_AUTH_CONFIG.organisation}/${FO_AUTH_CONFIG.name}`;
        return DEVICE_TOKEN_KEY + app;
    }

    static getDeviceToken(client = null) {
        try { return localStorage.getItem(LoginService.deviceTokenKey(client)); } catch (e) { return null; }
    }

    static saveDeviceToken(client, token) {
        try { localStorage.setItem(LoginService.deviceTokenKey(client), token); } catch (e) { }
    }

    static forgetDeviceToken(client = null) {
        try { localStorage.removeItem(LoginService.deviceTokenKey(client)); } catch (e) { }
    }

    /**
     * authorize/OIDC results are either tokens or a next step ({status: 'mfa_required' | 'mfa_setup_required'})
     */
    static nextStep(authResult) {
        if (!authResult) return null;
        // a setup-only token rides in `tokens`, so its status is only visible through `message`
        if (authResult.message === 'mfa_setup_required') {
            return { status: 'mfa_setup_required', tokens: authResult.getTokens() };
        }

        const raw = authResult.getTokens ? authResult.getTokens() : authResult;
        return (raw && raw.status === 'mfa_required') ? raw : null;
    }

    authorizeUser(requestBody, client) {
        return this.databaseService.userServices.authorize(requestBody, client);
    }

    resetPassword(userId, password, oldPassword, client) {
        return new Promise((resolve, reject) => {
            const resetPassword = () => this.update({ _id: userId, password }, null, client).then(resolve, reject);
            if (oldPassword) {
                return this.validatePassword({ _id: userId, password: oldPassword }, client).then(resetPassword, reject);
            }

            resetPassword();
        });
    }
    removeUser(userRef, client) {
        return this.databaseService.userServices.remove(userRef, client);
    }
    validatePassword(requestBody, client) {
        return this.databaseService.userServices.password.validate(requestBody, client);
    }
    update(requestBody, refId = null, client) {
        // remove the requestBody userId as it's not needed
        const userId = requestBody.userId || requestBody._id;
        if (!userId) return Promise.reject({ message: 'Invalid request userId is missing.' });
        if (requestBody && userId === refId) {
            requestBody = Object.assign({}, requestBody);
            if (!requestBody._id) requestBody._id = userId;
            delete requestBody.userId;
        }

        return this.databaseService.userServices.update(requestBody, client);
    }

    validateInput(field, value, client = null) {
        const request = { [field]: value };
        return this.databaseService.userServices.isExists(request, client);
    }
    /**
     * Call this service to retrive user token after successfull OIDC authorization
     * @param {*} data
     * @returns
     */
    getOidcToken(data, client = null) {
        if (!client) return this.databaseService.userServices.getOidcToken(data);
        return this.databaseService.core.api({ path: '/user/openid/token', method: 'GET', data, withClient: client })
            .then(unwrap)
            .then(result => this.databaseService.userServices.createAuthorizeInstance(result));
    }
    /**
     *
     * @param {*} type
     */
    getOpenIdURI(type, client = null) {
        const organisation = client ? client.organisation : FO_AUTH_CONFIG.organisation;
        const application = client ? client.application : FO_AUTH_CONFIG.name;
        return (`${FO_AUTH_CONFIG.openIdURL}/${organisation}/${application}/${type}?referrer=${window.location.origin}`);
    }

    sendEmailVerificationCode() {
        return this.databaseService.core.api({
            path: '/user/email/verification',
            method: 'POST'
        });
    }

    verifyEmailCode(data) {
        return this.databaseService.core.api({
            path: '/user/email/verification',
            method: 'PUT',
            data
        });
    }
}