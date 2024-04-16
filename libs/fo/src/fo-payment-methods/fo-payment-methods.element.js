import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';

Element({
    selector: 'fo-payment-methods',
    templateUrl: './fo-payment-methods.element.html',
    styleUrl: './fo-payment-methods.element.scss',
    events: ['onPaymentValidation:emitter'],
    props: ['token', 'name', 'canMakePayment', 'regenerateToken', 'btnText'],
    DI: ['changeDetector?']
})
export function FoPaymentMethodsElement(changeDetector) {
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth() + 1;
    this.validationInProgress = false;
    this.onPaymentValidation = new EventEmitter();
    this.changeDetector = changeDetector;
    this.tokenResponse = null;
    this.regenerateToken = true;
    this.btnText = 'Pay Now';

    this.paymentFormData = new FormControlService({
        number: {
            validators: {
                required: true,
                minLength: 14,
                isNumber: function(val) {
                    return !isNaN(Number((val || '').replace(/\s/g, '')));
                },
                valid_card: val => {
                    return this.isCreditCardValid(val);
                }
            }
        },
        name: {
            value: '',
            validators: {
                required: true,
                minLength: 3,
                maxLength: 65,
                pattern: "([a-zA-Z\s])+"
            }
        },
        expiration: {
            validators: {
                minLength: 4,
                required: true
            }
        },
        security_code: {
            validators: {
                required: true,
                minLength: 3,
                isNumber: function(val) {
                    return !isNaN(Number(val));
                },
                pattern: "\\d+$"
            }
        }
    });
}

FoPaymentMethodsElement.prototype.didInit = function() {
    this.clearFields();
    if (!this.token){
        this.errMsg = 'Card collection not possible at this time due to missing token.';
    }
}

FoPaymentMethodsElement.prototype._getCardType = function(number) {
    return [
        { regex: /^4/, type: "visa" },
        { regex: /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/, type: "mastercard" },
        { regex: /^3[47]/, type: "amex" },
        { regex: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/, type: "discover" },
        { regex: /^(36|30[0-5])/, type: "diners-club" },
        { regex: /^35(2[89]|[3-8][0-9])/, type: "jcb" }
    ].filter(function(t) { return t.regex.test(number); })[0];
}

FoPaymentMethodsElement.prototype.getCardType = function() {
    var card = this._getCardType(this.paymentFormData.value.number);
    return card ? card.type : 'N/A'
}

FoPaymentMethodsElement.prototype.hasError = function(fieldName) {
    var field = this.paymentFormData.getField(fieldName);
    return field.touched && field.invalid;
}


// takes the form field value and returns true on valid number
FoPaymentMethodsElement.prototype.isCreditCardValid = function(value) {
    value = (value || '').toString();
    // accept only digits, dashes or spaces
    if (/[^0-9-\s]+/.test(value)) return false;
    // The Luhn Algorithm. It's so pretty.
    var nCheck = 0,
        nDigit = 0,
        bEven = false;
    value = value.replace(/\D/g, "");

    for (var n = value.length - 1; n >= 0; n--) {
        var cDigit = value.charAt(n),
            nDigit = parseInt(cDigit, 10);

        if (bEven) {
            if ((nDigit *= 2) > 9) nDigit -= 9;
        }

        nCheck += nDigit;
        bEven = !bEven;
    }

    return (nCheck % 10) == 0;
}

FoPaymentMethodsElement.prototype.clearFields = function() {
    this.paymentFormData.reset({
        name: this.name
    });
};

FoPaymentMethodsElement.prototype.validateCardDetails = function() {
    // token already generated no need to generate new
    if (this.tokenResponse && !this.regenerateToken){
        return this.onPaymentValidation.emit(this.tokenResponse);
    }

    this.errMsg = "";
    /**
     * Omise config
     */
    this.validationInProgress = true;
    Omise.setPublicKey(this.token);
    var expiration = this.paymentFormData.value.expiration.split('/').map(Number);
    var payload = Object.assign({
        expiration_month: expiration[0],
        expiration_year: expiration[1]
    }, this.paymentFormData.value);
    delete payload.expiration;
    Omise.createToken('card', payload, (status_code, response) =>{
        if (status_code !== 200) {
            this.validationInProgress = false;
            this.errMsg = response.message;
            this.changeDetector.detectChanges();
            return;
        }

        this.validationInProgress = false;
        this.tokenResponse = response;
        this.onPaymentValidation.emit(response);
    });
};