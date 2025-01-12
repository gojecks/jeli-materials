import { AUTH_DATABASE_SERIVCE, FO_AUTH_CONFIG } from "../tokens";


Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export class LoginService {
    constructor(databaseService) {
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
    authorizeUser(requestBody) {
        return this.databaseService.userServices.authorize(requestBody);
    }
    resetPassword(requestBody, password) {
        return new Promise((resolve, reject) => {
            var resetPassword = () => this.update(requestBody).then(resolve, reject);
            if (password) {
                return this.validatePassword({ password }).then(resetPassword, reject);
            }

            resetPassword();
        });
    }
    removeUser(userRef) {
        return this.databaseService.userServices.remove(userRef);
    }
    validatePassword(requestBody) {
        return this.databaseService.userServices.password.validate(requestBody);
    }
    update(requestBody, refId) {
        // remove the requestBody userId as it's not needed
        if (requestBody && requestBody.userId && requestBody.userId === refId) {
            requestBody = Object.assign({}, requestBody);
            delete requestBody.userId;
        }

        return this.databaseService.userServices.update(requestBody);
    }
    validateInput(field, value) {
        var request = {};
        request[field] = {
            type: "ignoreCase",
            value: value
        };

        return this.databaseService.userServices.isExists(request);
    }
    /**
     * Call this service to retrive user token after successfull OIDC authorization
     * @param {*} data
     * @returns
     */
    getOidcToken(data) {
        return this.databaseService.userServices.getOidcToken(data);
    }
    /**
     *
     * @param {*} type
     */
    withOpenId(type) {
        var url = [FO_AUTH_CONFIG.openIdURL, FO_AUTH_CONFIG.organisation, FO_AUTH_CONFIG.name, type + '?referrer=' + window.location.origin].join('/');
        var auth_window = window.open(url, "ExternalAuthentication", "top=200,left=200,width=500,height=400,location=yes,status=yes,resizable=yes", true);
        auth_window.focus();
    }

    sendEmailVerificationCode(){
        return this.databaseService.core.api({ 
            path: '/user/email/verification', 
            method: 'POST'
        });
    }

    verifyEmailCode(data){
        return this.databaseService.core.api({ 
            path: '/user/email/verification', 
            method: 'PUT', 
            data
        });
    }
}