import {
    ComponentFactoryResolver,
    EventEmitter,
    animate,
    ProviderToken,
    DOMHelper
} from '@jeli/core';
import { renderMarkupElements } from '../markup.parser';
import { modalRegistry } from './modal.registry';

export var MODAL_INSTANCE = new ProviderToken('modalInstance', false);
export var MODAL_DATA = new ProviderToken('modalInstance', false)
/**
 * 
 * @param {*} context 
 * @returns 
 */
function createModalElement(context) {
    return DOMHelper.createElement('fo-modal', {
        class: `modal fade ${context.options.backDropClose ? 'pe-none' : ''}`,
        style: {
            display: context.options.displayType || 'block'
        }
    }, modalElement => {
        DOMHelper.createElement('div', {
            class: `modal-dialog ${context.options.modalStyle || ''}`
        }, modalDialogElement => {
            DOMHelper.createElement('div', {
                class: `modal-content ${context.options.customClass.content || ''}`
            }, modalContent => {
                if (context.options.showHeader) {
                    DOMHelper.createElement('div', {
                        class: `modal-header ${context.options.customClass.header || ''}`
                    }, modalHeader => {
                        if (context.options.title) {
                            DOMHelper.createElement('h5', { class: 'modal-title' }, parseValue(context.options.title, context.options.data, null, '-'), modalHeader);
                        }

                        if (!context.options.hideCloseBtn) {
                            DOMHelper.createElement('button', {
                                class: 'btn-close',
                                type: 'button'
                            }, null, modalHeader)
                                .addEventListener('click', () => context.close());
                        }
                    }, modalContent);
                }

                // generate body element
                DOMHelper.createElement('div', { class: `modal-body ${context.options.customClass.body || ''}` }, modalBody => {
                    if (context.options.template) {
                        if ('function' == typeof context.options.template)
                            modalBody.appendChild(context.options.template(context.options.data));
                        else if (context.options.markup)
                            modalBody.innerHTML = renderMarkupElements(context.options.template, context.options.data);
                        else
                            modalBody.innerHTML = parseValue(context.options.template, context.options.data, null, '-');
                    }
                    else if (context.options.component) {
                        var component = context.options.component;
                        if (modalRegistry.has(component)) {
                            component = modalRegistry.get(component);
                        }

                        // register values to Provider Tokens
                        MODAL_INSTANCE.register({ value: context });
                        MODAL_DATA.register({ value: context.options.data });
                        ComponentFactoryResolver(component, null, (componentRef) => {
                            context.componentViewRef = componentRef;
                            modalBody.appendChild(componentRef.nativeElement);
                        });
                    }
                }, modalContent);

                if (context.options.buttons) {
                    DOMHelper.createElement('div', {
                        class: `modal-footer ${context.options.customClass.footer || ''}`
                    }, modalFooter => {
                        // generate the buttons
                        context.options.buttons.forEach((button, idx) => {
                            DOMHelper.createElement('button', {
                                class: button.class,
                                type: 'button',
                                id: (button.id || 'modal_btn_' + idx),
                                data: {
                                    'ref-idx': idx
                                }
                            }, buttonEle => {
                                if (button.iconClass) {
                                    DOMHelper.creabuttonElement('i', { class: button.iconClass }, null, buttonEle);
                                }
                                buttonEle.innerText = button.label;
                            }, modalFooter);
                        });
                    }, modalContent).addEventListener('click', event => {
                        var clickBtn = event.target.closest('button');
                        if (clickBtn) {
                            var buttonDefinition = context.options.buttons[clickBtn.dataset.refIdx];
                            if (buttonDefinition) {
                                if ('function' == typeof buttonDefinition.action)
                                    buttonDefinition.action(event);
                                else
                                    context.onButtonClicked.emit(buttonDefinition);

                                if (buttonDefinition.dismiss) context.close();

                                buttonDefinition = null;
                            }
                        }
                    });
                }
            }, modalDialogElement);
        }, modalElement);
    }, document.body);
}


/**
 * 
 * @param {*} options 
 */
class ModalInstance {
    constructor(options) {
        this.componentViewRef = null;
        this.modalId = options.id || 'modal_' + +new Date;
        this.options = Object.assign({
            backDrop: true,
            backDropClose: true,
            customClass: {
                content: '',
                header: '',
                body: '',
                footer: ''
            },
            modalContentClass: '',
            showHeader: true,
            position: 'center',
            component: null,
            static: null,
            buttons: null,
            hideCloseBtn: false,
            displayType: 'flex',
            modalStyle: '',
            markup: false,
            data: null,
            title: '',
            closeTimeOut: null,
            openTimeOut: null
        }, options);
        this.componentInstance = null;
        this.isOpened = false;
        this.onModalOpened = new EventEmitter();
        this.onModalClosed = new EventEmitter();
        this.onButtonClicked = new EventEmitter();
        // create overlay
        this.nativeElement = createModalElement(this);
        if (this.options.backDrop) {
            this.overlay = document.createElement('div');
            this.overlay.classList.add('modal-backdrop', 'fade');
            this.overlay.addEventListener('click', () => this.close(true));
        }

        if (this.options.openTimeOut) {
            setTimeout(() => this.open(), this.options.openTimeOut);
        }
    }
    open() {
        if (this.isOpened) return;

        if (this.overlay) {
            document.body.appendChild(this.overlay);
            this.overlay.classList.add('show');
        }

        this.nativeElement.classList.toggle('show');
        this.onModalClosed.emit(true);
        // activate timeout
        if ('number' === typeof this.options.closeTimeOut) {
            setTimeout(() => this.close(false), this.options.closeTimeOut)
        }

        this.isOpened = false;
    }

    close(fromOverlay) {
        if (fromOverlay && !this.options.backDropClose) return;

        if (this.options.backDrop) {
            this.overlay.classList.toggle('show');
            if (this.overlay.parentElement)
                this.overlay.parentElement.removeChild(this.overlay);
        }

        animate.fadeOut(this.nativeElement, 500, () => {
            DOMHelper.remove(this.componentViewRef);
            this.nativeElement && this.nativeElement.parentElement.removeChild(this.nativeElement);
            this.cleanUp();
        });

        this.onModalClosed.emit({
            id: this.modalId,
            fromOverlay
        });
    }

    cleanUp() {
        this.nativeElement = null;
        this.options = null;
        this.overlay = null;
        this.onModalClosed.destroy();
        this.onButtonClicked.destroy();
        this.onModalOpened.destroy();
    }
}


Service()
export class ModalService {
    constructor() { }
    createModal(modalOptions) {
        return new ModalInstance(modalOptions);
    }

    /**
     * 
     * @param {*} template 
     * @param {*} timer 
     * @param {*} hideCloseBtn 
     * @returns 
     */
    alert(template, timer, hideCloseBtn) {
        return this.createModal({
            title: "Alert",
            template,
            closeTimeOut: timer || 2000,
            modalStyle: "modal-dialog-centered modal-sm",
            hideCloseBtn
        }).open();
    }

    /**
     * 
     * @param {*} template 
     * @param {*} buttons 
     * @param {*} hideCloseBtn 
     * @returns 
     */
    confirm(template, buttons, hideCloseBtn) {
        return this.createModal({
            title: "Please confirm",
            modalStyle: "modal-dialog-centered modal-sm",
            template,
            buttons,
            hideCloseBtn
        }).open();
    }

    /**
     * 
     * @param {*} template 
     * @param {*} buttons 
     * @returns 
     */
    prompt(template, buttons) {
        return this.createModal({
            title: "Prompt",
            modalStyle: "modal-dialog-centered modal-sm",
            template,
            buttons,
            hideCloseBtn: false
        }).open();
    }
}