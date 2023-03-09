import { EventEmitter } from '@jeli/core';
import { FormFieldControlService } from '@jeli/form';

Element({
    selector: 'fo-check-box',
    templateUrl: './check-box.element.html',
    styleUrl: './check-box.element.scss',
    props: ['id', 'control', 'name', 'type', 'cbClass', 'value'],
    events: ['onOptionSelected:emitter'],
    DI: ['ParentRef?=formControl']
})
export function CheckBoxElement(parentControl) {
    this.editorsId = "editBox_" + +new Date;
    this.parentControl = parentControl;
    this._control = new FormFieldControlService();
    this.type = 'native';
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
                    this._control = this.parentControl.getField(value);
                    this._controlPassed = true;
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

CheckBoxElement.prototype.viewDidLoad = function() {
    if (this._control) {
        this._control.valueChanges.subscribe(value => {
            if (!this._controlPassed) {
                this.onOptionSelected.emit(value);
            }
        });
    }
}


/**
 * Multiple checkbox element
 */
Element({
    selector: 'fo-multiple-check-box',
    template: '<div @click-delegate:button="badgeSelected(opt.value || opt)">\
    <button class="btn" type="button" attr-class="\'btn-\'+size +\' \'+btnClass" {:jClass}="(value.includes(opt.value || opt) ? \'btn-\': \'btn-outline-\')+btnColor" *for="opt in options">${:opt.label || opt}</button>\
  </div>',
    props: ['id', 'control', 'name', 'options', 'value', 'size', 'btnClass', 'btnColor'],
    events: ['onOptionSelected:emitter'],
    DI: ['ParentRef?=formControl']
})
export function MultipleCheckBox(parentControl) {
    CheckBoxElement.call(this, parentControl);
    this.size = 'sm';
    this.btnClass = 'me-1 mb-1';
    this.btnColor = 'primary';
}
MultipleCheckBox.prototype = Object.create(CheckBoxElement.prototype);
MultipleCheckBox.constructor = CheckBoxElement;
MultipleCheckBox.prototype.didInit = function() {
    if (this._control) {
        this.value = this._control.value;
    }
}

MultipleCheckBox.prototype.badgeSelected = function(opt) {
    this.value = this.value || [];
    var index = this.value.indexOf(opt);
    if (index > -1) {
        this.value.splice(index, 1);
    } else {
        this.value.push(opt);
    }

    this.pushValue();
}

MultipleCheckBox.prototype.pushValue = function(){
    if (this._control) {
        this._control.patchValue(this.value);
    } else {
        this.onOptionSelected.emit(this.value);
    }
}