import { EventEmitter, DOMHelper } from '@jeli/core';
Directive({
    selector: 'inputList',
    events: [
        'keyup focus blur:event=onEvent($event)',
        'inputListChange:emitter'
    ],
    props: [
        'options=:inputList',
        'selected',
        'allowFreeText:Boolean'
    ],
    DI: ['HostElement?'],
    modifiesDOM: true
})
export class FoTagListDirective {
    isAttached = false;
    isOptionFocused = false;
    options = [];
    value = null;
    isVisible = false;
    allowFreeText = false;

    constructor(hostElement) {
        this.hostElement = hostElement;
        this.id = (hostElement.nativeElement.id || +new Date) + '-listElement';
        this.inputListChange = new EventEmitter();
        this.optionListContainer = DOMHelper.createElement('div', {
            class: "fo-list-element",
            id: this.id,
            style: {
                position: 'fixed',
                padding: '.2em',
                color: '#fff',
                backgroundColor: '#000',
                display: 'none',
                zIndex: 15,
                overflow: 'hidden',
                overflowY: 'scroll'
            }
        },
            ele => {
                ele.addEventListener('click', this.onOptionListEvent.bind(this));
                ele.addEventListener('mouseenter', this.onOptionListEvent.bind(this));
                ele.addEventListener('mouseleave', this.onOptionListEvent.bind(this));
            });
    }

    set selected(value) {
        this.value = value;
        this.hostElement.nativeElement.value = value;
    }

    get selected() {
        return this.value;
    }

    onOptionListEvent(event) {
        return ({
            mouseenter: () => {
                this.isOptionFocused = true;
            },
            mouseleave: () => {
                this.isOptionFocused = false;
            },
            click: () => {
                // set the value
                this.selected = event.target.dataset.key;
                this._emit();
                this.showBox(false);
                this.isOptionFocused = false;
            }
        })[event.type]();
    }
    onEvent(event) {
        var value = event.target.value;
        return ({
            blur: () => {
                if (!this.isOptionFocused) this.showBox(false);
            },
            focus: () => {
                if (!this.isAttached) {
                    this.hostElement.nativeElement.parentElement.appendChild(this.optionListContainer);
                    this.isAttached = true;
                }

                this.generateView(value)
            },
            keyup: () => this.generateView(value)
        })[event.type]();
    }
    generateView(value) {
        var listItems = this.options || [];
        if (this.value != value || (!listItems.length && this.isVisible)) {
            if (value) {
                listItems = listItems.filter(item => item.startsWith(value));
                if (!listItems.length && this.allowFreeText) {
                    listItems = [value];
                }
            }

            this.optionListContainer.innerHTML = listItems.map(item => `<a class="px-2 pt-1 text-white d-block" data-key="${item}"> ${item} </a>`).join('');
            this.isVisible = listItems.length > 0;
        }

        this.value = value;
        this.showBox(this.isVisible);
        listItems = null;
    }

    viewDidDestroy() {
        this.optionListContainer.remove();
        this.optionListContainer = null;
        this.hostElement = null;
    }

    _emit() {
        this.inputListChange.emit({
            value: this.value,
            idx: (this.options || []).indexOf(this.value)
        });
    }

    showBox(show) {
        this.optionListContainer.style.display = show ? 'block' : 'none';
        if (show) {
            var rect = this.hostElement.nativeElement.getBoundingClientRect();
            var bodyRect = document.body.getBoundingClientRect();
            var containerRect = this.optionListContainer.getBoundingClientRect();
            var cTop = (rect.top + rect.height);
            var height = containerRect.height;
            var right = (bodyRect.width - rect.right);
            if (height > rect.top) {
                height = (containerRect.height / 2);
                this.optionListContainer.style.height = height + 'px';
            }
            // calculate top for container
            if ((height + cTop) > bodyRect.height) {
                cTop = rect.top - height;
            }
            // calculate right for container
            if (containerRect.width < rect.width) {
                right += ((rect.width - containerRect.width) / 2);
            }

            this.optionListContainer.style.right = right + 'px';
            this.optionListContainer.style.top = cTop + 'px';
        }
    }
}