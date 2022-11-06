import { EventEmitter } from '@jeli/core';

Element({
    selector: 'fo-radio-button',
    templateUrl: './radio-button.element.html',
    styleUrl: './radio-button.element.scss',
    props: ['label', 'disabled', 'name', 'size'],
    DI: ['ParentRef?=formControl'],
    viewChild: [
        'radioItemLists:QueryList=radio-item'
    ]
})
export function RadioButtonElement(parentControl) {
    this.parentControl = parentControl;
    this._disabled = false;
    this.fieldControl = null;
    this._unsubscribe = null;
    this.size = "sm";

    Object.defineProperty(this, 'disabled', {
        set: function(value) {
            this._disabled = value;
            if (this.radioItemLists && this._disabled !== value)
                this.setDisabled();
        }
    });
}

RadioButtonElement.prototype.didInit = function() {
    var _this = this;
    if (this.parentControl && this.name) {
        this.fieldControl = this.parentControl.getField(this.name);

        if (this.fieldControl) {
            this._unsubscribe = this.fieldControl.valueChanges
                .subscribe(function(value) {
                    _this.setValue(value, true);
                });
        }
    }
}

RadioButtonElement.prototype.viewDidLoad = function() {
    var _this = this;
    this.radioItemLists.forEach(function(elementRef) {
        elementRef.componentInstance.onValueChanged
            .subscribe(function(value) {
                _this.setValue(value);
            })
    });
    this.setDisabled();
    if (this.fieldControl && this.fieldControl.value !== null) {
        this.setValue(this.fieldControl.value, true);
    }
};

RadioButtonElement.prototype.viewDidDestroy = function() {
    this._unsubscribe && this._unsubscribe();
}

RadioButtonElement.prototype.setDisabled = function() {
    var _this = this;
    this.radioItemLists.forEach(function(elementRef) {
        if (elementRef.componentInstance instanceof RadioItemElement) {
            elementRef.componentInstance.setDisabled(_this._disabled);
        }
    });
};

RadioButtonElement.prototype.setValue = function(value, ignoreValuePatching) {
    this.radioItemLists.forEach(function(elementRef) {
        elementRef.componentInstance.setSelected(elementRef.componentInstance.value === value);
    });

    if (!ignoreValuePatching && this.fieldControl) {
        this.fieldControl.patchValue(value, { emitToView: false });
    }
};



var totalItem = 0;
Element({
    selector: 'radio-item',
    template: '<button type="button" class="btn btn-${type}" {:jClass}="{\'active\':selected}" attr-id="_id" @click="buttonClicked()" {disabled}="disabled">\
    <j-place></j-place></button>',
    props: ['value', 'id', 'type'],
    events: ['onValueChanged:emitter'],
    DI: ['changeDetector?']
})
export function RadioItemElement(changeDetector) {
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
}

RadioItemElement.prototype.buttonClicked = function() {
    this.selected = true;
    this.onValueChanged.emit(this.value);
}

RadioItemElement.prototype.setDisabled = function(value) {
    this.disabled = value;
    this.changeDetector.detectChanges();
}

RadioItemElement.prototype.setSelected = function(value) {
    if (value == this.selected) return;
    this.selected = value;
    this.changeDetector.detectChanges();
};