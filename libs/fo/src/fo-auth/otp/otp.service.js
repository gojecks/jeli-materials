import { AUTH_DATABASE_SERIVCE } from "../tokens"

Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export class OtpService{
    constructor(databaseSerice){
        this.databaseSerice = databaseSerice;
    }

    sendCode(identifier, notify){
        return this.databaseSerice.core.api('/otp/create', {
            identifier,
            notify
         });
    }

    validateCode(identifier, validationCode, onAfterValidate){
        return this.databaseSerice.core.api('/otp/validate', {
            identifier,
            validationCode,
            onAfterValidate
         });
    }

    resendCode(identifier){
        return this.databaseSerice.core.api('/otp/regenerate', {
            identifier
         });
    }
}