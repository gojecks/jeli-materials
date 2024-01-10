import { EventEmitter, DOMHelper } from '@jeli/core';
Directive({
    selector: 'inputList',
    events: [
        'keyup focus blur:event=onEvent($event)',
        'inputListChange:emitter'
    ],
    props: ['options=:inputList'],
    DI: ['HostElement?']
})
export function FoTagListDirective(hostElement) {
    this.hostElement = hostElement;
    this.isOptionFocused = false;
    this.id = (hostElement.nativeElement.id || +new Date) + '-listElement'
    this.inputListChange = new EventEmitter();
    this.options = [];
    this.value = null;
    this.isVisible = false;
    this.optionListContainer = DOMHelper.createElement('div', {
        class: "position-fixed pb-1 text-bg-dark",
        id: this.id,
        style: {
            display: 'none',
            zIndex: 1
        }
    },
        ele => {
            ele.addEventListener('click', this.onOptionListEvent.bind(this))
            ele.addEventListener('mouseenter', this.onOptionListEvent.bind(this))
            ele.addEventListener('mouseleave', this.onOptionListEvent.bind(this))
        }, hostElement.nativeElement.parentElement);
}

FoTagListDirective.prototype.onOptionListEvent = function (event) {
    return ({
        mouseenter: () => {
            this.isOptionFocused = true;
        },
        mouseleave: () => {
            this.isOptionFocused = false;
        },
        click: () => {
            var value = event.target.dataset.key;
            // set the value
            this.hostElement.nativeElement.value = value;
            this.inputListChange.emit({
                value,
                idx: this.options.indexOf(value)
            });
            this.showBox(false);
            this.isOptionFocused = false;
        }
    })[event.type]();
}

FoTagListDirective.prototype.onEvent = function (event) {
    var value = event.target.value;
    return ({
        blur: () => {
            if (!this.isOptionFocused) this.showBox(false);
        },
        focus: () => this.generateView(value),
        keyup: () => this.generateView(value)
    })[event.type]()
}


FoTagListDirective.prototype.generateView = function (value) {
    if (this.value != value) {
        var listItems = this.options;
        if (value) {
            listItems = listItems.filter(item => item.startsWith(value));
        }
        this.optionListContainer.innerHTML = listItems.map(item => '<a class="px-2 pt-1 text-white d-block" data-key="' + item + '">' + item + '</a>').join('');
        this.isVisible = listItems.length > 0;
    }

    this.value = value;
    this.showBox(this.isVisible);
}

FoTagListDirective.prototype.viewDidDestroy = function () {
    this.optionListContainer.remove();
    this.optionListContainer = null;
    this.hostElement = null;
}

FoTagListDirective.prototype.showBox = function (show) {
    this.optionListContainer.style.display = show ? 'block' : 'none';
    if (show) {
        var rect = this.hostElement.nativeElement.getBoundingClientRect();
        var bodyRect = document.body.getBoundingClientRect();
        this.optionListContainer.style.top = (rect.top + rect.height) + 'px';
        var containerWidth = this.optionListContainer.offsetWidth;
        var right = (bodyRect.width - rect.right);
        if(containerWidth < rect.width){
            right += ((rect.width - containerWidth) / 2);
        }
        this.optionListContainer.style.right =  right + 'px';
    }
}