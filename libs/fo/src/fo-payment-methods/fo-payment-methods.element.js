import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';

Element({
    selector: 'fo-payment-methods',
    templateUrl: './fo-payment-methods.element.html',
    styleUrl: './fo-payment-methods.element.scss',
    events: ['onPaymentValidation:emitter'],
    props: ['token', 'name', 'canMakePayment']
})
export function FoPaymentMethodsElement() {
    var currentYear = new Date().getFullYear();
    var currentMonth = new Date().getMonth() + 1;
    var _this = this;
    this.validationInProgress = false;
    this.monthRange = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    this.yearRange = [];
    this.onPaymentValidation = new EventEmitter();
    for (var d = currentYear; d <= currentYear + 12; d++) {
        this.yearRange.push(d);
    }

    this.paymentFormData = new FormControlService({
        number: {
            validators: {
                required: true,
                minLength: 14,
                isNumber: function(val) {
                    return !isNaN(Number((val || '').replace(/\s/g, '')));
                },
                valid_card: function(val) {
                    return _this.valid_credit_card(val);
                }
            }
        },
        name: {
            value: '',
            validators: {
                minLength: 6,
                pattern: "([a-zA-Z\s])+"
            }
        },
        expiration_month: {
            validators: {
                required: true,
                minLength: 2,
                isCurrentYearAndPastMonth: function(val) {
                    return !(_this.formData.expiration_year == currentYear && currentMonth >= val);
                }
            }
        },
        expiration_year: {
            validators: {
                minLength: 4
            }
        },
        security_code: {
            validators: {
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
    var test = this._getCardType(this.paymentFormData.value.number);
    return test ? ("fa-credit-card") : "";
}


// takes the form field value and returns true on valid number
FoPaymentMethodsElement.prototype.valid_credit_card = function(value) {
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
    var _this = this;
    this.errMsg = "";
    /**
     * Omise config
     */
    this.validationInProgress = true;
    Omise.setPublicKey(this.token);
    Omise.createToken('card', this.paymentFormData.value, function(status_code, response) {
        if (status_code !== 200) {
            _this.validationInProgress = false;
            _this.clearFields();
            _this.errMsg = response.message;
            _this.changeDetector.detectChanges();
            return;
        }
        _this.onPaymentValidation.emit(response);
    });
};