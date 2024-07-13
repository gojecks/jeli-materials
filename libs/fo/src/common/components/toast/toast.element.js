import {EventEmitter} from '@jeli/core';

Element({
    selector: 'fo-toast',
    templateUrl: './toast.element.html',
    styleUrl: './toast.element.scss',
    props: ['containerClass:String', 'autoClose:Number', 'showToast', 'bgClass'],
    events: [
        'onCloseToast:emitter'
    ]
})
export class ToastElement {
    constructor(){
        this.customClass = '';
        this.autoClose = 0;
        this._showToast = false;
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
    }

    didInit(){
        this.triggerAutoClose(); 
    }

    triggerAutoClose(){
        if (this.autoClose && typeof this.autoClose == 'number'){
            setTimeout(() => this.closeToast(), this.autoClose);
        }
    }
}