import { EventEmitter } from '@jeli/core';

var totalItem = 0;
Element({
    selector: 'fo-radio-button',
    templateUrl: './radio-button.element.html',
    styleUrl: './radio-button.element.scss',
    props: ['label', 'value', 'disabled', 'name', 'size', 'type', 'flex'],
    events: ['onValueChanged:emitter'],
    DI: ['ParentRef?=formControl']
})
export function RadioButtonElement(parentControl) {
    this.parentControl = parentControl;
    this.onValueChanged = new EventEmitter();
    this._disabled = false;
    this.fieldControl = null;
    this._unsubscribe = null;
    this._value = null;
    this.size = "sm";
    this.type = 'button';
    this.radioItemLists = [];

    Object.defineProperties(this, {
        'disabled': {
            set: function (value) {
                this._disabled = value;
                if (this.radioItemLists && this._disabled !== value)
                    this.setDisabled();
            }
        },
        value: {
            get: () => (this.fieldControl ? this.fieldControl.value : this._value),
            set: value => {
                this._value = value;
                this.setValue(value);
            }
        }
    });
}

RadioButtonElement.prototype.setRadioItem = function (radioItem) {
    this.radioItemLists.push(radioItem);
    radioItem.setDisabled(this._disabled);
    radioItem.setSelected(this.value);
}

RadioButtonElement.prototype.didInit = function () {
    if (this.parentControl && this.name) {
        this.fieldControl = this.parentControl.getField(this.name);
        if (this.fieldControl) {
            this._unsubscribe = this.fieldControl.valueChanges
                .subscribe(value => this.setValue(value, true));
        }
    }
}

RadioButtonElement.prototype.viewDidLoad = function () {
    this.setDisabled();
    if (this.fieldControl && this.fieldControl.value !== null) {
        this.setValue(this.fieldControl.value, true);
    }
};

RadioButtonElement.prototype.viewDidDestroy = function () {
    this._unsubscribe && this._unsubscribe();
    this.radioItemLists.length = 0;
}

RadioButtonElement.prototype.setDisabled = function () {
    for (var radioItem of this.radioItemLists) {
        radioItem.setDisabled(this._disabled);
    }
}

RadioButtonElement.prototype.setValue = function (value, ignoreValuePatching) {
    for (var radioItem of this.radioItemLists) {
        radioItem.setSelected(value);
    }

    if (!ignoreValuePatching && this.fieldControl) {
        this.fieldControl.patchValue(value, { emitToView: false });
    }
    this.onValueChanged.emit(value);
};

RadioButtonElement.prototype.removeRadioItem = function (radioItem) {
    this.radioItemLists.splice(this.radioItemLists.indexOf(radioItem), 1);
}


Element({
    selector: 'radio-item',
    templateUrl: './radio-item.html',
    props: ['value', 'id', 'type', 'label', 'iconClass', 'cbClass'],
    events: ['onValueChanged:emitter', 'click-delegate:button,input=itemChecked()'],
    DI: ['changeDetector?', 'ContentHostRef?']
})
export function RadioItemElement(changeDetector, contentHostRef) {
    if (!contentHostRef) throw Error('<radio-item/> requires ConenentHostRef<fo-radio-button> in-order to function');
    this.contentHostRef = contentHostRef;
    this.changeDetector = changeDetector;
    this.cbClass = '';
    this.onValueChanged = new EventEmitter();
    this.disabled = false;
    this.selected = false;
    this._id = "radio_option_" + totalItem++;
    this.type = "outline-primary";

    Object.defineProperty(this, 'id', {
        set: function (value) {
            if (value) {
                this._id = value;
            }
        }
    });

    contentHostRef.setRadioItem(this);
}

RadioItemElement.prototype.didInit = function () {
    this.selected = (this.value == this.contentHostRef.value);
}

RadioItemElement.prototype.itemChecked = function () {
    this.selected = true;
    this.contentHostRef.setValue(this.value);
}

RadioItemElement.prototype.setDisabled = function (value) {
    this.disabled = value;
    this.changeDetector.detectChanges();
}

RadioItemElement.prototype.setSelected = function (value) {
    this.selected = ((value !== null) && value == this.value);
    this.changeDetector.detectChanges();
};

RadioItemElement.prototype.viewDidDestroy = function () {
    this.contentHostRef.removeRadioItem(this);
}