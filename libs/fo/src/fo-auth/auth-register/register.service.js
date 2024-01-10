import { AUTH_DATABASE_SERIVCE } from "../tokens";

Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export function RegisterService(databaseService) {
    this.databaseService = databaseService;
}

RegisterService.prototype.validateInput = function (field, value) {
    return this.databaseService.userServices.isExists({
        [field]: {
            type: "ignoreCase",
            value
        }
    });
}

RegisterService.prototype.createUser = function(payload){
    return this.databaseService.userServices.add(payload)
}