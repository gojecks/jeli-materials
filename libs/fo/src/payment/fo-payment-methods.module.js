import { CommonModule } from '@jeli/common';
import { FormModule } from '@jeli/form';
import { FoPaymentMethodsService } from './fo-payment-methods/fo-payment-methods.service.js';
import { FoPaymentMethodsElement } from './fo-payment-methods/fo-payment-methods.element.js';
import { FoCommonDirectivesModule } from '../common/common.module.js';


jModule({
    requiredModules: [
        CommonModule,
        FormModule,
        FoCommonDirectivesModule
    ],
    selectors: [
        FoPaymentMethodsElement,
    ],
    services: [
        FoPaymentMethodsService
    ]
})
export function FoPaymentMethodsModule() {}