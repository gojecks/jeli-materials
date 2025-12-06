import { parseText } from "../../../utils";

Element({
    selector: 'fo-accordion',
    templateUrl: './accordion.element.html',
    styleUrl: './accordion.element.scss',
    props: ['items', 'alwaysOpen', 'flush']
})
export class FoAccordionElement {
    constructor() {
        this.currentSelectedAccord = -1;
        this.flush = false;
        this.alwaysOpen = false;
        this.items = [];
        this._selected = [];
    }
    parseMarkup(markup, data) {
        return parseText(markup, data, true);
    }
    selected(idx) {
        if (!this._selected.includes(idx)) {
            if (this.alwaysOpen)
                this._selected.push(idx);

            else
                this._selected = [idx];
        } else {
            this._selected.splice(this._selected.indexOf(idx), 1);
        }
    }
}



Element({
    selector: 'fo-accordion-item',
    props: ['name', 'id'],
    DI: ['ContentHostRef?']
})
export function FoAccordionItemElement(contentHostRef) {
    if (!(contentHostRef instanceof FoAccordionElement)) {
        throw new Error('<fo-accordion-item/> requires ConenentHostRef<fo-accordion> element in-order to function');
    }
}