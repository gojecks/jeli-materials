Element({
    selector: 'fo-accordion',
    templateUrl: './accordion.element.html',
    styleUrl: './accordion.element.scss',
    props: ['items', 'alwaysOpen', 'flush']
})
export function FoAccordionElement() {
    this.currentSelectedAccord = -1;
    this.flush = false;
    this.alwaysOpen = false;
    this.items = [];
}