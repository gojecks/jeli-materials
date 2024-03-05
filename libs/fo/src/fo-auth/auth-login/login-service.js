import { AUTH_DATABASE_SERIVCE, FO_AUTH_CONFIG } from "../tokens";


Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export function LoginService(databaseService) {
    this.databaseService = databaseService;
}

LoginService.prototype.validateAndSendEmail = function(requestBody) {
    return this.databaseService.userServices.password.forgot(requestBody);
}

LoginService.prototype.resendCode = function(identifier) {
    return this.databaseService.userServices.password.resendCode(identifier);
}

LoginService.prototype.validateCode = function(requestBody) {
    return this.databaseService.userServices.password.validateCode(requestBody);
}

LoginService.prototype.authorizeUser = function(requestBody) {
    return this.databaseService.userServices.authorize(requestBody)
}

LoginService.prototype.resetPassword = function(requestBody, password) {
    return new Promise((resolve, reject) => {
        var resetPassword = () => this.update(requestBody).then(resolve, reject);
        if (password){
            return this.validatePassword({password}).then(resetPassword, reject);
        }

        resetPassword();
    });
};

LoginService.prototype.removeUser = function(userRef) {
    return this.databaseService.userServices.remove(userRef) 
}

LoginService.prototype.validatePassword = function(requestBody) {
    return this.databaseService.userServices.password.validate(requestBody)
}

LoginService.prototype.update = function(requestBody, refId) {
    // remove the requestBody userId as it's not needed
    if (requestBody && requestBody.userId && requestBody.userId === refId) {
        requestBody = Object.assign({}, requestBody);
        delete requestBody.userId;
    }

    return this.databaseService.userServices.update(requestBody);
}

LoginService.prototype.validateInput = function(field, value) {
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
LoginService.prototype.getOidcToken = function(data) {
    return this.databaseService.userServices.getOidcToken(data);
}

/**
 * 
 * @param {*} type 
 */
LoginService.prototype.withOpenId = function(type) {
    var url = [FO_AUTH_CONFIG.openIdURL, FO_AUTH_CONFIG.organisation, FO_AUTH_CONFIG.name, type + '?referrer=' + window.location.origin].join('/');
    var auth_window = window.open(url, "ExternalAuthentication", "top=200,left=200,width=500,height=400,location=yes,status=yes,resizable=yes", true);
    auth_window.focus();
}