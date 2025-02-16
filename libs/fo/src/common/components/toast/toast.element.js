import {EventEmitter} from '@jeli/core';

Element({
    selector: 'fo-toast',
    templateUrl: './toast.element.html',
    styleUrl: './toast.element.scss',
    props: [
        'containerClass:String', 
        'autoClose:Number', 
        'showToast', 
        'bgClass',
        'hideBody'
    ],
    events: [
        'onCloseToast:emitter'
    ]
})
export class ToastElement {
    constructor(){
        this.containerClass = 'top-0 start-50';
        this.customClass = '';
        this.autoClose = 0;
        this._showToast = false;
        this.timerId = null;
        this.hideBody = false;
        this.onCloseToast = new EventEmitter()
    }

    set showToast(value){
        if (value) {
            this.triggerAutoClose();
        }
        this._showToast = value;
    }

    get showToast(){
        return this._showToast;
    }

    closeToast(){
        this.onCloseToast.emit(true);
        this.timerId = null;
    }

    didInit(){
        clearTimeout(this.timerId);
        this.timerId = null;
        this.triggerAutoClose(); 
    }

    triggerAutoClose(){
        if (!this.timerId && this.autoClose && typeof this.autoClose == 'number'){
            this.timerId = setTimeout(() => this.closeToast(), this.autoClose);
        }
    }
}