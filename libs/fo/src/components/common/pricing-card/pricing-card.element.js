import { EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-pricing-card',
    templateUrl: './pricing-card.element.html',
    styleUrl: './pricing-card.element.scss',
    props: ['packages'],
    events: ['onPackageSelected:emitter']
})
export function PricingCardElement() {
    this.onPackageSelected = new EventEmitter();
}