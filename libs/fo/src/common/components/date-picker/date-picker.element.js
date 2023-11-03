import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-date-picker',
    templateUrl: './date-picker.element.html',
    styleUrl: './date-picker.element.scss',
    props: ['label', 'name', 'disabled', 'maxAge', 'minAge', 'minDate', 'maxDate', 'minYear', 'maxYear', 'hintLabel', 'isDT', 'toTS'],
    DI: ['ParentRef?=formControl'],
    events: [
        'onDateChange:emitter'
    ]
})
export function DatePickerElement(parentControl) {
    var _this = this;
    var today = new Date();
    this.parentControl = parentControl;
    this.fieldControl = null;
    this._disabled = false;
    this._minMaxValidator = {};
    this.isDT = false;
    this._maxDateSet = false;
    this.onDateChange = new EventEmitter();
    this.todaysDate = [today.getMonth() + 1, today.getDate(), today.getFullYear(), today.getHours(), today.getMinutes()];
    this._control = new FormControlService({
        day: {
            value: this.todaysDate[1],
            validators: {
                required: true,
                maxLength: 2,
                maxNumber: 31,
                minNumber: 1
            }
        },
        month: {
            value: this.todaysDate[0],
            validators: {
                required: true,
                maxLength: 2,
                maxNumber: 12,
                minNumber: 1
            }
        },
        year: {
            value: this.todaysDate[2],
            validators: {
                required: true,
                minLength: 4
            }
        }
    }, {
        validMaxDate: function(value) {
            return _this.minMaxValidator(value, 'max');
        },
        validMinDate: function(value) {
            return _this.minMaxValidator(value, 'min');
        }
    });

    Object.defineProperties(this, {
        'disabled': {
            set: function(value) {
                this._disabled = value;
                this._control[value ? 'disable' : 'enable']();
                if (this.fieldControl) {
                    this.fieldControl[value ? 'disable' : 'enable']();
                }
            },
            get: function() {
                return this._disabled;
            }
        },
        maxAge: {
            set: function(value) {
                this._minMaxValidator.max = _this._getTimeStamp(value);
            }
        },
        minAge: {
            set: function(value) {
                this._minMaxValidator.min = _this._getTimeStamp(value);
            }
        },
        minDate: {
            set: function(value) {
                this._minMaxValidator.min = _this._getDateTimeStamp(value);
            }
        },
        maxDate: {
            set: function(value) {
                this._maxDateSet = true;
                this._minMaxValidator.max = _this._getDateTimeStamp(value);
            }
        },
        minYear: {
            set: function(value) {
                this._minMaxValidator.min = _this._getTimeStamp(value, true);
            }
        },
        maxYear: {
            set: function(value) {
                this._minMaxValidator.max = _this._getTimeStamp(value, true);
            }
        }
    });
}

DatePickerElement.prototype.didInit = function() {
    var _this = this;
    if (this.parentControl && this.name) {
        this.fieldControl = this.parentControl.getField(this.name);
        this._control.patchValue(this.fieldControl.value);
        this.fieldControl.valueChanges.subscribe(function(value) {
            _this._control.patchValue(value, { self: true });
        });
    }

    this._control.valueChanges.subscribe(function(value) {
        if (_this._control.valid) {
            value = (_this.toTS ? _this.getTimeStampFromObject(value) : value);
            if (_this.fieldControl)
                _this.fieldControl.patchValue(value);
            else
                _this.onDateChange.emit(value);
        }
    });

    if (this.isDT) {
        this._control.addField('hour', {
            value: this.todaysDate[3],
            validators: {
                required: true,
                maxNumber: 23
            }
        });
        this._control.addField('min', {
            value: this.todaysDate[4],
            validators: {
                required: true,
                maxNumber: 59
            }
        });
    }
}

DatePickerElement.prototype._getTimeStamp = function(value, isYear) {
    return new Date([this.todaysDate[0], this.todaysDate[1], (isYear ? value : this.todaysDate[2] - value)].join('-')).getTime();
};

DatePickerElement.prototype.minMaxValidator = function(value, type) {
    var validator = this._minMaxValidator[type];
    if (validator && (value.day && value.month && value.year)) {
        var userStamp = this.getTimeStampFromObject(value);
        if (type == 'min' || this._maxDateSet) {
            return userStamp <= validator;
        }
        return userStamp >= validator;
    }

    return true;
}

DatePickerElement.prototype.getTimeStampFromObject = function(value) {
    if (!value) { return Date.now(); }
    if (typeof value === 'number') return value;
    var dateValue = new Date([value.month, value.day, value.year]);
    if (this.isDT) {
        dateValue.setHours(value.hour);
        dateValue.setMinutes(value.min);
    }
    return dateValue.getTime();
}

DatePickerElement.prototype._getDateTimeStamp = function(value) {
    if (value && typeof value === 'string') {
        return new Date(value).getTime();
    }
    return this.getTimeStampFromObject(value);
};