import { DOMHelper } from '@jeli/core';
Directive({
    selector: 'foPasswordTextSwitcher',
    events: [
        'focus:event=onFocus()'
    ],
    DI: ['HostElement?']
})
export class FoPasswordTextSwitcherDirective {
    isToggled = false;
    isFocused = false;
    constructor(hostElement) {
        this.hostElement = hostElement;
        this.iconElement = DOMHelper.createElement('span', {
            style: {
                position: 'absolute',
                display: 'none',
                right: '.5em',
                cursor: 'pointer',
                background: '#ffffff',
                padding: '0.1rem'
            },
            class: 'bi-eye-slash-fill'
        }, ele => ele.addEventListener('click', this.toggleView.bind(this), false), hostElement.nativeElement.parentElement);
    }
    onFocus() {
        if (!this.isFocused) {
            this.isFocused = true;
            var rect = this.hostElement.nativeElement.getBoundingClientRect();
            if (!this.hostElement.nativeElement.parentElement.classList.contains('position-relative')) {
                this.hostElement.nativeElement.parentElement.classList.toggle('position-relative');
            }
            this.iconElement.style.display = 'block';
            this.iconElement.style.top = rect.height + 'px';
        }
    }
    viewDidDestroy() {
        this.iconElement.remove();
        this.iconElement = null;
        this.hostElement = null;
    }
    toggleView(event) {
        this.hostElement.nativeElement.type = this.isToggled ? 'password' : 'text';
        this.iconElement.classList.toggle('bi-eye-slash-fill');
        this.iconElement.classList.toggle('bi-eye-fill');
        this.isToggled = !this.isToggled;
    }
}



