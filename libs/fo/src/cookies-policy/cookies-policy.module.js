import { CommonModule } from '@jeli/common';
import { CookiesPolicyElement } from './cookies-policy.element';

jModule({
    requiredModules: [
        CommonModule,

    ],
    selectors: [
        CookiesPolicyElement
    ]
})
export function CookiesPolicyModule() {}