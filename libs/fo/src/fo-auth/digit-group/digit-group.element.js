import { EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-digit-group',
    templateUrl: './digit-group.element.html',
    styleUrl: './digit-group.element.scss',
    events: ['onDigitGroupChange:emitter']
})
export class FoDigitGroupElement {
    
    constructor(){
        this.capturedCode = {};
        this.onDigitGroupChange = new EventEmitter();
    }

    didInit(){}

    handleDigitGroup(event) {
        var code = (event.code || '').toLowerCase();
        // set the value
        this.capturedCode[event.target.id] = event.target.value;
        if (['arrowleft', 'backspace'].includes(code)) {
            var previous = event.target.previousSibling;
            if (previous && previous.localName == 'input') {
                previous.select();
            }
        } else if ('arrowright' == code || code.startsWith('key') || code.startsWith('digit')) {
            // store code
            var next = event.target.nextSibling;
            if (next && next.localName == 'input') {
                next.select();
            }
        }

        this.onDigitGroupChange.emit(Object.values(this.capturedCode).join(''));
    }
}
