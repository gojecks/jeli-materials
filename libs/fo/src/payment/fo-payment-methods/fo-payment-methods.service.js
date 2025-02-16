import { LazyLoader } from '@jeli/core';
import { FormControlService } from '@jeli/form';
import { AUTH_DATABASE_SERIVCE } from '../../fo-auth/tokens';

var STATIC_URLS = {
    stripe: 'https://js.stripe.com/v3/',
    omise: 'https://cdn.omise.co/omise.js'
};

Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export class FoPaymentMethodsService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.stripeCache = null;
    }

    getFormControl() {
        return new FormControlService({
            number: {
                validators: {
                    required: true,
                    minLength: 14,
                    isNumber: function (val) {
                        return !isNaN(Number((val || '').replace(/\s/g, '')));
                    },
                    valid_card: val => this.isCreditCardValid(val)
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
                    isNumber: function (val) {
                        return !isNaN(Number(val));
                    },
                    pattern: "\\d+$"
                }
            }
        });
    }

    loadPaymentScript(type, cb) {
        LazyLoader.staticLoader([STATIC_URLS[type.toLowerCase()]], cb, 'js');
    }

    createToken(type, token, cardDetails) {
        switch (type) {
            case ('omise'):
                return this.paymentByOmise(token, cardDetails);
                break;
            case ('stripe'):
                return this.paymentByStripe(cardDetails);
                break;
        }
    }

    paymentByStripe(cardDetails) {
        return this.stripeCache.stripe.createToken(this.stripeCache.card, {
            data: {
                name: cardDetails.name
            }
        }).then(res => res.token, err => err);
    }

    paymentByOmise(token, cardDetails) {
        return new Promise((resolve, reject) => {
            var expiration = cardDetails.expiration.split('/').map(Number);
            var payload = Object.assign({
                expiration_month: expiration[0],
                expiration_year: expiration[1]
            }, cardDetails);
            delete payload.expiration;
            Omise.setPublicKey(token);
            Omise.createToken('card', payload, (status_code, response) => {
                if (status_code !== 200) {
                    return reject(response);
                }

                return resolve(response);
            });
        })
    }

    initializeStripeForm(context) {
        if (!this.stripeCache) {
            console.log('[Payment] Creating Stripe cache');
            var stripe = Stripe(context.token);
            var element = stripe.elements();
            var card = element.create('card', context.stripeConfig || {
                disableLink: true,
                hidePostalCode: true,
                style: {
                    base: {
                        fontSize: "15px",
                        color: "#32325d",
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                        fontSmoothing: "antialiased",
                        "::placeholder": {
                            color: "rgba(0,0,0,0.4)"
                        }
                    }
                }
            });

            this.stripeCache = {
                stripe,
                element,
                card
            };
        }
    }

    mountStripeView(stripeMountView){
        if (stripeMountView && this.stripeCache) {
            this.stripeCache.card.mount(stripeMountView);
        }
    }

    stripeFormcomplete() {
        return this.stripeCache && this.stripeCache.card._complete;
    }

    unMountStripeView() {
        this.stripeCache && this.stripeCache.card.unmount();
    }

    paymentMethods(data, method, cache) {
        if (!this.databaseService) return Promise.reject('No databaseService defined');
        return this.databaseService.core.api({ path: '/v2/payment/customer/card', method, data, cache });
    }

    searchCustomers(query, merchant) {
        if (!this.databaseService) return Promise.reject('No databaseService defined');
        return this.databaseService.core.api({
            path: '/v2/payment/search', data: {
                query,
                scope: 'customers',
                merchant,
                withPaymentMethods: true,
                single: true
            }
        });
    }

    getToken(merchant) {
        if (!this.databaseService) return Promise.reject('No databaseService defined');
        return this.databaseService.core.api({ path: '/v2/payment/token', data: { merchant } })
    }

    isCreditCardValid(value) {
        value = (value || '').toString();
        // accept only digits, dashes or spaces
        if (/[^0-9-\s]+/.test(value)) return false;
        // The Luhn Algorithm. It's so pretty.
        var nCheck = 0, nDigit = 0, bEven = false;
        value = value.replace(/\D/g, "");

        for (var n = value.length - 1; n >= 0; n--) {
            var cDigit = value.charAt(n), nDigit = parseInt(cDigit, 10);

            if (bEven) {
                if ((nDigit *= 2) > 9) nDigit -= 9;
            }

            nCheck += nDigit;
            bEven = !bEven;
        }

        return (nCheck % 10) == 0;
    }

    getCardType(number) {
        return [
            { regex: /^4/, type: "visa" },
            { regex: /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/, type: "mastercard" },
            { regex: /^3[47]/, type: "amex" },
            { regex: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/, type: "discover" },
            { regex: /^(36|30[0-5])/, type: "diners-club" },
            { regex: /^35(2[89]|[3-8][0-9])/, type: "jcb" }
        ].filter(function (t) { return t.regex.test(number); })[0];
    }
}