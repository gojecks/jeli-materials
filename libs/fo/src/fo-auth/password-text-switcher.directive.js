import { DOMHelper } from '@jeli/core';
Directive({
    selector: 'foPasswordTextSwitcher',
    events: [
        'focus:event=onFocus()'
    ],
    DI: ['HostElement?']
})
export function FoPasswordTextSwitcherDirective(hostElement) {
    this.hostElement = hostElement;
    this.isToggled = false;
    this.isFocused = false;
    this.iconElement =  DOMHelper.createElement('span', {
        style: {
            position: 'absolute',
            display: 'none',
            right: '.5em',
            cursor: 'pointer',
            background:'#ffffff',
            padding: '0.1rem'
        },
        class: 'bi-eye-slash-fill'
    }, ele => ele.addEventListener('click', this.toggleView.bind(this), false), hostElement.nativeElement.parentElement);
}

FoPasswordTextSwitcherDirective.prototype.onFocus = function(){
    if (!this.isFocused) {
        this.isFocused = true;
        var rect = this.hostElement.nativeElement.getBoundingClientRect();
        if (!this.hostElement.nativeElement.parentElement.classList.contains('position-relative')){
            this.hostElement.nativeElement.parentElement.classList.toggle('position-relative')
        }
        this.iconElement.style.display = 'block';
        this.iconElement.style.top = rect.height + 'px';
    }
}

FoPasswordTextSwitcherDirective.prototype.viewDidDestroy = function () {
    this.iconElement.remove();
    this.iconElement = null;
    this.hostElement = null;
}

FoPasswordTextSwitcherDirective.prototype.toggleView = function (event) {
    this.hostElement.nativeElement.type = this.isToggled ? 'password' : 'text';
    this.iconElement.classList.toggle('bi-eye-slash-fill');
    this.iconElement.classList.toggle('bi-eye-fill');
    this.isToggled = !this.isToggled;
}