import { EventEmitter } from '@jeli/core';
import { FormFieldControlService } from '@jeli/form';
import { internal_counter } from '../../../utils';

Element({
    selector: 'fo-check-box',
    templateUrl: './check-box.element.html',
    styleUrl: './check-box.element.scss',
    props: [
        'id', 
        'control', 
        'name', 
        'size', 
        'type', 
        'cbClass', 
        'value', 
        'btnClass', 
        'btnColor',
        'options', 
        'label',
        'disabled',
        'switchMode'
    ],
    events: ['onOptionSelected:emitter'],
    DI: ['ParentRef?=formControl']
})
export class CheckBoxElement {
    constructor(parentControl) {
        this.editorsId = "editBox_" + internal_counter++;
        this.parentControl = parentControl;
        this._control = new FormFieldControlService();
        this.type = 'native';
        this.size = 'sm';
        this.btnClass = 'me-1 mb-1';
        this.btnColor = 'primary';
        this.switchMode = false;
        this._name = '';
        this.options = null;
        this.onOptionSelected = new EventEmitter();
        this._controlPassed = false;
        this._value = null;
        this._disabled = false;
    }

    set name(value) {
        if (this.parentControl) {
            var control = this.parentControl.getField(value);
            if (control){
                this._control = control;
                this._controlPassed = true;
            }
        }
        this._name = value;
    }
    get name() {
        return this._name;
    }
    set control(value) {
        this._control = value;
        this._controlPassed = true;
    }

    get control() {
        return this._control;
    }

    set value(value) {
        this._value = value;
        this._control.patchValue(value);
    }

    get value() {
        return this._value;
    }

    set disabled(value){
        this._disabled = value;
        this._control[value ? 'disable': 'enable']();
    }

    get disabled(){
        return this._disabled;
    }

    didInit() {
        if (this._control)
            this._value = this._control.value;
    }
    viewDidLoad() {
        if (this._control) {
            this._control.valueChanges.subscribe(value => {
                if (!this._controlPassed) {
                    this.onOptionSelected.emit(value);
                }
            });
        }
    }
    badgeSelected(opt) {
        this._value = this._value || [];
        var index = this._value.indexOf(opt);
        if (index > -1) {
            this._value.splice(index, 1);
        } else {
            this._value.push(opt);
        }

        this.pushValue();
    }
    pushValue() {
        if (this._control) {
            this._control.patchValue(this._value);
            this._control.markAsTouched();
        } else {
            this.onOptionSelected.emit(this._value);
        }
    }
}