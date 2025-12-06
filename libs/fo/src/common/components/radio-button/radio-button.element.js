import { EventEmitter } from '@jeli/core';
import { internal_counter } from '../../../utils';
Element({
    selector: 'fo-radio-button',
    templateUrl: './radio-button.element.html',
    styleUrl: './radio-button.element.scss',
    props: ['label', 'value', 'disabled', 'name', 'size', 'type', 'flex', 'groupBtn'],
    events: ['onValueChanged:emitter'],
    DI: ['ParentRef?=formControl']
})
export class RadioButtonElement {
    constructor(parentControl) {
        this.parentControl = parentControl;
        this.onValueChanged = new EventEmitter();
        this._disabled = false;
        this.fieldControl = null;
        this._unsubscribe = null;
        this._value = null;
        this.size = "sm";
        this.type = 'button';
        this.groupBtn = true;
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
    setRadioItem(radioItem) {
        this.radioItemLists.push(radioItem);
        radioItem.setDisabled(this._disabled);
        radioItem.setSelected(this.value);
    }
    didInit() {
        if (this.parentControl && this.name) {
            this.fieldControl = this.parentControl.getField(this.name);
            if (this.fieldControl) {
                this._unsubscribe = this.fieldControl.valueChanges
                    .subscribe(value => this.setValue(value, true));
            }
        }
    }
    viewDidLoad() {
        this.setDisabled();
        if (this.fieldControl && this.fieldControl.value !== null) {
            this.setValue(this.fieldControl.value, true);
        }
    }
    viewDidDestroy() {
        this._unsubscribe && this._unsubscribe();
        this.radioItemLists.length = 0;
    }
    setDisabled() {
        for (var radioItem of this.radioItemLists) {
            radioItem.setDisabled(this._disabled);
        }
    }
    setValue(value, ignoreValuePatching) {
        for (var radioItem of this.radioItemLists) {
            radioItem.setSelected(value);
        }

        if (!ignoreValuePatching && this.fieldControl) {
            this.fieldControl.patchValue(value, { emitToView: false });
            this.fieldControl.markAsTouched();
        }
        this.onValueChanged.emit(value);
    }
    removeRadioItem(radioItem) {
        this.radioItemLists.splice(this.radioItemLists.indexOf(radioItem), 1);
    }
}


Element({
    selector: 'radio-item',
    templateUrl: './radio-item.html',
    props: ['value', 'id', 'type', 'label', 'iconClass', 'cbClass'],
    events: ['onValueChanged:emitter', 'click-delegate:button,input=itemChecked()'],
    DI: ['changeDetector?', 'ContentHostRef?']
})
export class RadioItemElement {
    constructor(changeDetector, contentHostRef) {
        if (!contentHostRef) throw Error('<radio-item/> requires ConenentHostRef<fo-radio-button> in-order to function');
        this.contentHostRef = contentHostRef;
        this.changeDetector = changeDetector;
        this.cbClass = '';
        this.onValueChanged = new EventEmitter();
        this.disabled = false;
        this.selected = false;
        this._id = "radio_option_" + internal_counter++;
        this.type = "outline-primary";
        contentHostRef.setRadioItem(this);
    }

    set id(value){
        if (value) {
            this._id = value;
        }
    }

    didInit() {
        this.selected = (this.value === this.contentHostRef.value);
    }
    itemChecked() {
        this.selected = true;
        this.contentHostRef.setValue(this.value);
    }
    setDisabled(value) {
        this.disabled = value;
        this.changeDetector.detectChanges();
    }
    setSelected(value) {
        this.selected = ((value !== null) && value == this.value);
        this.changeDetector.detectChanges();
    }
    viewDidDestroy() {
        this.contentHostRef.removeRadioItem(this);
    }
}
