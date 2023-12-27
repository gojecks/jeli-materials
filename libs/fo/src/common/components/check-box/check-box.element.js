import { EventEmitter } from '@jeli/core';
import { FormFieldControlService } from '@jeli/form';

Element({
    selector: 'fo-check-box',
    templateUrl: './check-box.element.html',
    styleUrl: './check-box.element.scss',
    props: ['id', 'control', 'name', 'size', 'type', 'cbClass', 'value', 'btnClass', 'btnColor','options', 'label'],
    events: ['onOptionSelected:emitter'],
    DI: ['ParentRef?=formControl']
})
export function CheckBoxElement(parentControl) {
    this.editorsId = "editBox_" + +new Date;
    this.parentControl = parentControl;
    this._control = new FormFieldControlService();
    this.type = 'native';
    this.size = 'sm';
    this.btnClass = 'me-1 mb-1';
    this.btnColor = 'primary';
    this._name = '';
    this.options = null;
    this.onOptionSelected = new EventEmitter();
    this._controlPassed = false;
    this._value = null;

    Object.defineProperties(this, {
        name: {
            set: function(value) {
                if (this.parentControl) {
                    this._name = value;
                    var control = this.parentControl.getField(value);
                    if (control){
                        this._control = control;
                        this._controlPassed = true;
                    }
                }
            },
            get: function() {
                return this._name;
            }
        },
        control: {
            set: function(value) {
                this._control = value;
                this._controlPassed = true;
            },
            get: function() {
                return this._control;
            }
        },
        value: {
            set: function(value) {
                if (this._control) {
                    this._control.patchValue(value);
                }

                this._value = value;
            },
            get: function() {
                return this._value;
            }
        }
    });
}

CheckBoxElement.prototype.didInit = function() {
    if (this._control) {
        this.value = this._control.value;
    }
}

CheckBoxElement.prototype.viewDidLoad = function() {
    if (this._control) {
        this._control.valueChanges.subscribe(value => {
            if (!this._controlPassed) {
                this.onOptionSelected.emit(value);
            }
        });
    }
}

CheckBoxElement.prototype.badgeSelected = function(opt) {
    this.value = this.value || [];
    var index = this.value.indexOf(opt);
    if (index > -1) {
        this.value.splice(index, 1);
    } else {
        this.value.push(opt);
    }

    this.pushValue();
}

CheckBoxElement.prototype.pushValue = function(){
    if (this._control) {
        this._control.patchValue(this.value);
    } else {
        this.onOptionSelected.emit(this.value);
    }
}