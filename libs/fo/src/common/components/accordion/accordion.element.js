import { parseText } from "../../../utils";

Element({
    selector: 'fo-accordion',
    templateUrl: './accordion.element.html',
    styleUrl: './accordion.element.scss',
    props: ['items', 'alwaysOpen', 'flush', 'data']
})
export function FoAccordionElement() {
    this.currentSelectedAccord = -1;
    this.flush = false;
    this.alwaysOpen = false;
    this.items = [];
    this._selected  = [];
}

FoAccordionElement.prototype.parseMarkup = function(markup){
    return parseText(markup, this.data, true);
}

FoAccordionElement.prototype.selected = function(idx){

    if (!this._selected.includes(idx)){
        if (this.alwaysOpen) 
            this._selected.push(idx);
        else 
            this._selected = [idx];
    } else {
        this._selected.splice(this._selected.indexOf(idx), 1);
    }
}