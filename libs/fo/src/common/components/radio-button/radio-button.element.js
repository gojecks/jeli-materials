import { EventEmitter } from '@jeli/core';

var totalItem = 0;
Element({
    selector: 'fo-radio-button',
    templateUrl: './radio-button.element.html',
    styleUrl: './radio-button.element.scss',
    props: ['label', 'disabled', 'name', 'size'],
    DI: ['ParentRef?=formControl']
})
export function RadioButtonElement(parentControl) {
    this.parentControl = parentControl;
    this._disabled = false;
    this.fieldControl = null;
    this._unsubscribe = null;
    this.size = "sm";
    this.radioItemLists = [];

    Object.defineProperty(this, 'disabled', {
        set: function(value) {
            this._disabled = value;
            if (this.radioItemLists && this._disabled !== value)
                this.setDisabled();
        }
    });
}

RadioButtonElement.prototype.setRadioItem = function(radioItem) {
    this.radioItemLists.push(radioItem);
    radioItem.setDisabled(this._disabled);
    radioItem.setSelected(this.fieldControl && this.fieldControl.value);
}

RadioButtonElement.prototype.didInit = function() {
    if (this.parentControl && this.name) {
        this.fieldControl = this.parentControl.getField(this.name);
        if (this.fieldControl) {
            this._unsubscribe = this.fieldControl.valueChanges
                .subscribe(value => this.setValue(value, true));
        }
    }
}

RadioButtonElement.prototype.viewDidLoad = function() {
    this.setDisabled();
    if (this.fieldControl && this.fieldControl.value !== null) {
        this.setValue(this.fieldControl.value, true);
    }
};

RadioButtonElement.prototype.viewDidDestroy = function() {
    this._unsubscribe && this._unsubscribe();
    this.radioItemLists.length = 0;
}

RadioButtonElement.prototype.setDisabled = function() {
    for(var radioItem of this.radioItemLists){
        radioItem.setDisabled(this._disabled);
    }
}

RadioButtonElement.prototype.setValue = function(value, ignoreValuePatching) {
    for(var radioItem of this.radioItemLists) {
        radioItem.setSelected(value);
    }

    if (!ignoreValuePatching && this.fieldControl) {
        this.fieldControl.patchValue(value, { emitToView: false });
    }
};

RadioButtonElement.prototype.removeRadioItem = function(radioItem){
    this.radioItemLists.splice(this.radioItemLists.indexOf(radioItem), 1);
}


Element({
    selector: 'radio-item',
    template: '<button type="button" class="btn btn-${type}" {:jClass}="{\'active\':selected}" attr-id="_id" @click="buttonClicked()" {disabled}="disabled">\
    <i {class}="iconClass"></i> ${label}</button>',
    props: ['value', 'id', 'type', 'label', 'iconClass'],
    events: ['onValueChanged:emitter'],
    DI: ['changeDetector?', 'ContentHostRef?']
})
export function RadioItemElement(changeDetector, contentHostRef) {
    if (!contentHostRef) throw Error('<radio-item/> requires ConenentHostRef<fo-radio-button> in-order to function');
    this.contentHostRef = contentHostRef;
    this.changeDetector = changeDetector;
    this.onValueChanged = new EventEmitter();
    this.disabled = false;
    this.selected = false;
    this._id = "radio_option_" + totalItem++;
    this.type = "outline-primary";

    Object.defineProperty(this, 'id', {
        set: function(value) {
            if (value) {
                this._id = value;
            }
        }
    });

    contentHostRef.setRadioItem(this);
}

RadioItemElement.prototype.buttonClicked = function() {
    this.selected = true;
    this.contentHostRef.setValue(this.value);
}

RadioItemElement.prototype.setDisabled = function(value) {
    this.disabled = value;
    this.changeDetector.detectChanges();
}

RadioItemElement.prototype.setSelected = function(value) {
    this.selected = (value == this.value);
    this.changeDetector.detectChanges();
};

RadioItemElement.prototype.viewDidDestroy = function(){
    this.contentHostRef.removeRadioItem(this);
}