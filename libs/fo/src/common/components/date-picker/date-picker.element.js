import { FormControlService } from '@jeli/form';
import { EventEmitter } from '@jeli/core';
import { DatetimeService } from '@jeli/common/datetime';
Element({
    selector: 'fo-date-picker',
    templateUrl: './date-picker.element.html',
    styleUrl: './date-picker.element.scss',
    props: [
        'label',
        'name',
        'disabled',
        'maxAge',
        'minAge',
        'minDate:string|number',
        'maxDate:string|number',
        'minYear:string|number',
        'maxYear:string|number',
        'hintLabel',
        'isDT',
        'toTS',
        'size',
        'type'
    ],
    DI: ['ParentRef?=formControl', DatetimeService],
    events: [
        'onDateChange:emitter'
    ]
})
export class DatePickerElement {
    constructor(parentControl, datetimeService) {
        this.parentControl = parentControl;
        this.dateTimeService = datetimeService;
        this.fieldControl = null;
        this._disabled = false;
        this._minMaxValidator = {};
        this.isDT = false;
        this._maxDateSet = false;
        this.size='md';
        this.type='default';
        this.onDateChange = new EventEmitter();
        this.todaysDate = this.getDateFromTimeStamp();
        this._control = new FormControlService({
            day: {
                value: null,
                validators: {
                    required: true,
                    maxLength: 2,
                    maxNumber: 31,
                    minNumber: 1
                }
            },
            month: {
                value: null,
                validators: {
                    required: true,
                    maxLength: 2,
                    maxNumber: 12,
                    minNumber: 1
                }
            },
            year: {
                value: null,
                validators: {
                    required: true,
                    minLength: 4
                }
            }
        }, {
            validMaxDate: (value) => {
                return this.minMaxValidator(value, 'max');
            },
            validMinDate: (value) => {
                return this.minMaxValidator(value, 'min');
            }
        });
    }


    get disabled() {
        return this._disabled;
    }

    set disabled(value) {
        this._disabled = value;
        this._control[value ? 'disable' : 'enable']();
        if (this.fieldControl) {
            this.fieldControl[value ? 'disable' : 'enable']();
        }
    }

    set maxAge(value) {
        this._minMaxValidator.max = this._getTimeStamp(value);
    }

    set minAge(value) {
        this._minMaxValidator.min = this._getTimeStamp(value);
    }

    set minDate(value) {
        this._minMaxValidator.min = this.getTimeStampFromObject(value);
    }

    set maxDate(value) {
        this._maxDateSet = true;
        this._minMaxValidator.max = this.getTimeStampFromObject(value);
    }

    set minYear(value) {
        this._minMaxValidator.min = this._getTimeStamp(value, true);
    }

    set maxYear(value) {
        this._minMaxValidator.max = this._getTimeStamp(value, true);
    }


    get dateAsString(){
        return `${this._control.value.year}-${this._control.value.month}-${this._control.value.day}T${this._control.value.hour}:${this._control.value.min}`;
    }

    didInit() {
        if (this.isDT) {
            this._control.addFields({
                hour: {
                    value: null,
                    validators: {
                        required: true,
                        maxNumber: 23
                    }
                },
                min: {
                    value: null,
                    validators: {
                        required: true,
                        maxNumber: 59
                    }
                }
            });
        }

        var value = this.todaysDate;
        if (this.parentControl && this.name) {
            this.fieldControl = this.parentControl.getField(this.name);
            value = this.fieldControl.value;
            if (typeof value == 'number')
                value = this.getDateFromTimeStamp(value);
            this.fieldControl.valueChanges.subscribe((value) => {
                this._control.patchValue(value, { self: true });
            });
        }

        // patch the value
        this._control.patchValue(value);
        this._control.valueChanges.subscribe((value) => {
            if (this._control.valid) {
                value = (this.toTS ? this.getTimeStampFromObject(value) : value);
                if (this.fieldControl)
                    this.fieldControl.patchValue(value);
                else
                    this.onDateChange.emit(value);
            }
        });
    }

    _getTimeStamp(value, isYear) {
        return new Date([(isYear ? value : this.todaysDate.year - value), this.todaysDate.month, this.todaysDate.day].join('-')).getTime();
    };

    minMaxValidator(value, type) {
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

    getTimeStampFromObject(value) {
        if(!value) return Date.now(); // value not defined
        if ('string' == typeof value){
            value = new Date(['now', 'today'].includes(value.toLowerCase()) ? Date.now() : value).getTime();
            return isNaN(value) ? Date.now() : value;
        }
            
        let dateValue = new Date([value.month, value.day, value.year]);
        if (this.isDT) {
            dateValue.setHours(value.hour);
            dateValue.setMinutes(value.min);
        }
        return dateValue.getTime();
    }

    _getDateTimeStamp(value) {
        if (value && typeof value === 'string'){
            return new Date(value).getTime();
        }

        return ;
    }

    getDateFromTimeStamp(timestamp){
        const timeObject = this.dateTimeService.timeConverter(timestamp);
        return {
            day: timeObject.flags.DD,
            month: timeObject.flags.MM,
            year: timeObject.flags.YYYY,
            hour: timeObject.flags.hh,
            min: timeObject.flags.mm
        }
    }

    onDateTimeInput(element){
        this._control.patchValue(this.getDateFromTimeStamp(element.value));
    }
}

