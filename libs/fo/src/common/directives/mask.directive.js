import {EventEmitter} from '@jeli/core';

Directive({
    selector:'foMask',
    events: [
        'keyup:event=onKeyUp($event.target)',
        'input:event=onInput($event.target)',
        'maskValueChanged:emitter'
    ],
    props: ['pattern=:foMask', 'limit', 'separator']
})
export function FoMaskDirective(){
    this.pattern = '';
    this.separator = ' ';
    this.limit = 3;
    this.newValue = '';
    this.oldValue = '';
    this.cursorPosition = 0;
    this.isSpaceSeparator = true;
    this.maskValueChanged = new EventEmitter();
}

FoMaskDirective.prototype.didInit = function(){
    this.isSpaceSeparator = /\s/.test(this.separator);
    this.pattern = new RegExp(this.pattern, 'g');
}

FoMaskDirective.prototype.onKeyUp = function(target) {
    this.oldValue = target.value;
    this.cursorPosition = target.selectionEnd;
}

FoMaskDirective.prototype.onInput = function(target) {
    var newValue = this.unmask(target.value);
    var originalValue = newValue;
	var newCursorPosition;

    if ( newValue.match(this.pattern)) {
        newValue = this.mask(newValue, this.limit, this.separator);
        if (this.isSpaceSeparator) {
            newCursorPosition = this.cursorPosition - this.checkSeparator(this.cursorPosition, this.limit) + 
            this.checkSeparator(this.cursorPosition + (newValue.length - this.oldValue.length), this.limit) + 
            (this.unmask(newValue).length - this.unmask(this.oldValue).length);
        }

        target.value = (newValue !== "") ? newValue : "";
    } else {
        target.value = this.oldValue;
        newCursorPosition = this.cursorPosition;
    }
    
    if (this.isSpaceSeparator){
        target.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    //emit the value
	this.maskValueChanged.emit(originalValue);
}

FoMaskDirective.prototype.mask = function(value, limit, separator){
    var output = [];
    for (let i = 0; i < value.length; i++) {
        if ( i !== 0 && i % limit === 0) {
            output.push(separator);
        }
        
        output.push(value[i]);
    }
    
    return output.join("");
}

FoMaskDirective.prototype.unmask = function(value) {
    return value.replace(/[^\d]/g, '');
}

FoMaskDirective.prototype.checkSeparator = function(position, interval){
    return Math.floor(position / (interval + 1))
}