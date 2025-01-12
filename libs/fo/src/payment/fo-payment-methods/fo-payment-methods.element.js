import { EventEmitter } from '@jeli/core';
import { FoPaymentMethodsService } from './fo-payment-methods.service';
import { ModalService } from '../../modal/modal.service';

Element({
    selector: 'fo-payment-methods',
    templateUrl: './fo-payment-methods.element.html',
    styleUrl: './fo-payment-methods.element.scss',
    events: [
        'onPaymentValidation:emitter',
        'onPaymentSelected:emitter'
    ],
    viewChild: [
        'stripeMountView:HTMLElement=#stripeMountView',
        'deletePaymentMethod:TemplateRef=#deletePaymentMethodView',
        'addPaymentMethod:TemplateRef=#addPaymentMethodView',
        'editCardDetails:TemplateRef=editCardDetailsView'
    ],
    props: [
        'token',
        'name',
        'canMakePayment',
        'regenerateToken',
        'btnText',
        'merchant',
        'stripeConfig',
        'existingPaymentConfig'
    ],
    DI: [
        'changeDetector?',
        FoPaymentMethodsService,
        ModalService
    ]
})
export class FoPaymentMethodsElement {
    constructor(changeDetector, foPaymentMethodsService, modalService) {
        this.foPaymentMethodsService = foPaymentMethodsService;
        this.changeDetector = changeDetector;
        this.modalService = modalService;
        var curDate = new Date();
        this.canMakePayment = true;
        this.currentYear = curDate.getFullYear();
        this.currentMonth = curDate.getMonth() + 1;
        this.validationInProgress = false;
        this.onPaymentValidation = new EventEmitter();
        this.onPaymentSelected = new EventEmitter();
        this.tokenResponse = null;
        this.regenerateToken = true;
        this.btnText = 'Pay Now';
        this.merchant = 'omise';
        this.selectedMethodType = null;
        this.customerDetails = {};
        this._existingPaymentConfig = {
            enabled: false,
            header: 'Payment Methods',
            btnClass: 'btn-outline-primary',
            btnLabel: 'Add Payment Method',
            query: {
                'metadata.userId': null
            },
            onCreate: {},
            paymentMethods: [{
                title: 'Add a credit / debit card',
                description: 'We accept Visa, MasterCard, JCB and American Express',
                type: 'card'
            }],
            modalTitles: {
                deletePaymentMethod: 'Delete Payment Method',
                addPaymentMethod: 'Add Payment Method',
                editCardDetails: 'Edit Details'
            }
        };
        this.stripeConfig = null;
        this.paymentFormData = foPaymentMethodsService.getFormControl();
    }

    get formValid() {
        return (this.isStripePayment ? this.foPaymentMethodsService.stripeFormcomplete() : this.paymentFormData.valid)
    }

    set existingPaymentConfig(value) {
        Object.assign(this._existingPaymentConfig, value || {});
    }

    get existingPaymentConfig() {
        return this._existingPaymentConfig;
    }

    set stripeMountView(element){
        this.foPaymentMethodsService.mountStripeView(element);
    }

    get stripeMountView(){
        return null;
    }

    didInit() {
        this.clearFields();
        this.isStripePayment = (this.merchant == 'stripe');
        if (!this.token) {
            this.foPaymentMethodsService.getToken(this.merchant)
                .then(res => {
                    this.token = res.result.token;
                    this.loadPaymentMethods();
                }, () => {
                    this.errMsg = 'Card collection not possible at this time due to missing token.';
                })
        }
    }

    viewDidLoad() {
        this.foPaymentMethodsService.loadPaymentScript(this.merchant, () => {
            if (this.isStripePayment && this.token) {
                this.foPaymentMethodsService.initializeStripeForm(this);
            }
        });
    }

    viewDidDestroy(){
        this.foPaymentMethodsService.unMountStripeView();
    }

    getCardType() {
        var card = this.foPaymentMethodsService.getCardType(this.paymentFormData.value.number);
        return card ? card.type : 'N/A';
    }

    hasError(fieldName) {
        var field = this.paymentFormData.getField(fieldName);
        return field.touched && field.invalid;
    }

    clearFields() {
        this.paymentFormData.reset({
            name: this.name
        });
    }

    validateCardDetails() {
        // token already generated no need to generate new
        if (this.tokenResponse && !this.regenerateToken) {
            return this.onPaymentValidation.emit({
                type: this.merchant,
                token: this.tokenResponse
            });
        }

        this.errMsg = "";
        /**
         * Omise config
         */
        this.validationInProgress = true;
        this.foPaymentMethodsService
            .createToken(this.merchant, this.token, this.paymentFormData.value)
            .then(res => {
                this.validationInProgress = false;
                this.tokenResponse = res;
                if (this.existingPaymentConfig.enabled){
                    this.addCardToCustomer();
                } else {
                    this.onPaymentValidation.emit({
                        type: this.merchant,
                        token: this.tokenResponse
                    });
                }
            }, err => {
                this.validationInProgress = false;
                this.errMsg = err.message;
                this.changeDetector.detectChanges();
            });
    }

    addCardToCustomer() {
        if (!this.customerDetails.cards){
            this.customerDetails.cards = [];
        }
            
        var payload = {
            source: this.tokenResponse.id,
            metadata: {
                created: +new Date
            }
        };

        if (!this.customerDetails.id && this.existingPaymentConfig.onCreate) {
            Object.assign(payload, this.existingPaymentConfig.onCreate);
        }

        this.onAddError = false;
        this.foPaymentMethodsService.paymentMethods({
            cid: this.customerDetails.id,
            merchant: this.merchant,
            payload
        }, 'POST').then(res => {
            // pusht the card details to list
            if (this.customerDetails.id){
                this.customerDetails.cards.push.apply(this.customerDetails.card, res.result.cards);
            } else {
                this.customerDetails = Object.assign({cards: [this.tokenResponse.card]}, res.result);
                // emit the newly created card as default
                this.emitSelectedCard(this.tokenResponse);
            }

            this.openedModalInstance.close();
            this.changeDetector.detectChanges();
        }, () => {
            this.onAddError = true;
            this.changeDetector.detectChanges();
        });
    }

    loadPaymentMethods() {
        if (!this._existingPaymentConfig.enabled) return;
        this.foPaymentMethodsService.searchCustomers(
            this._existingPaymentConfig.query,
            this.merchant
        ).then(res => {
            this.customerDetails = res.result || {};
            // payment method already assigned to customer
            this.emitSelectedCard();
            this.changeDetector.detectChanges();
        });
    }

    paymentMethodAction(id, card) {
        this.selectedCard = card;
        if (id == 'deleteCard') {
            this.modalService.confirm(this.deletePaymentMethod,
                [{
                    label: 'Proceed',
                    class: 'btn btn-danger',
                    dismiss: true,
                    action: () => {
                        this.foPaymentMethodsService.paymentMethods({ 
                            cardId: card.id, 
                            cid: this.customerDetails.id, 
                            merchant: this.merchant
                        }, 'DELETE')
                            .then(() => {
                                this.customerDetails.cards.splice(this.customerDetails.cards.indexOf(card), 1);
                                this.changeDetector.detectChanges();
                            }, err => this.modalService.alert(err.message));
                    }
                }]);
        } else {
            this.openedModalInstance = this.modalService.createModal({
                template: this[id],
                title: this.existingPaymentConfig.modalTitles[id],
                modalStyle: 'modal-dialog-centered',
                displayType: 'block'
            });

            this.openedModalInstance.open();
            this.openedModalInstance.onModalClosed.subscribe(() => {
                this.foPaymentMethodsService.unMountStripeView();
            })
        }
    }

    emitSelectedCard(card){
        // support for only stripe and omise
        if (this.customerDetails.id && this.customerDetails.cards.length){
            this.onPaymentSelected.emit({
                customerId: this.customerDetails.id,
                card: (card || this.customerDetails.cards.find(c => c.id === this.customerDetails.default_source || c.default))
            });
        }
    }
}