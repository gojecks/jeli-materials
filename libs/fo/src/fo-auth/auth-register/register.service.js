import { AUTH_DATABASE_SERIVCE } from "../tokens";

Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export class RegisterService {
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    validateInput(field, value) {
        return this.databaseService.userServices.isExists({
            [field]: {
                type: "ignoreCase",
                value
            }
        });
    }
    createUser(payload) {
        return this.databaseService.userServices.add(payload);
    }
}


