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
                transform: 'translateY(-50%)',
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
            var input = this.hostElement.nativeElement;
            if (!input.parentElement.classList.contains('position-relative')) {
                input.parentElement.classList.toggle('position-relative');
            }
            // center on the input's own vertical midpoint, not the parent's, since a <label> can sit above it
            this.iconElement.style.top = (input.offsetTop + input.offsetHeight / 2) + 'px';
            this.iconElement.style.display = 'block';
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



