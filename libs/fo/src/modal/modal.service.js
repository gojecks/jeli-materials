import { ComponentFactoryResolver, EventEmitter, animate, ProviderToken, DOMHelper } from '@jeli/core';
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
        class: 'modal fade',
        style: {
            display: context.options.displayType || 'block'
        }
    }, modalElement => {
        DOMHelper.createElement('div', {
            class: `modal-dialog ${context.options.modalStyle || ''}`
        }, modalDialogElement => {
            DOMHelper.createElement('div', {
                class: 'modal-content'
            }, modalContent => {
                if (!context.options.hideHeader) {
                    DOMHelper.createElement('div', {
                        class: 'modal-header'
                    }, modalHeader => {
                        if (context.options.title) {
                            DOMHelper.createElement('h5', { class: 'modal-title'}, parseValue(context.options.title, context.options.data, null, '-'), modalHeader);
                        }
                
                        if (!context.options.hideCloseBtn) {
                            DOMHelper.createElement('button', {
                                class:'btn-close',
                                type: 'button'
                            }, null, modalHeader)
                            .addEventListener('click', () => context.close());
                        }
                    }, modalContent); 
                }
            
                // generate body element
                if (context.options.template || context.options.component) {
                    DOMHelper.createElement('div', { class: 'modal-body' }, modalBody => {
                        if (context.options.template) {
                            if (context.options.markup)
                                modalBody.innerHTML = renderMarkupElements(context.options.template, context.options.data);
                            else
                                modalBody.innerHTML = parseValue(context.options.template, context.options.data, null, '-');
                        } else if (context.options.component) {
                            var component = context.options.component;
                            if (modalRegistry.has(component)) {
                                component = modalRegistry.get(component);
                            }

                            // register values to Provider Tokens
                            MODAL_INSTANCE.register({value: context});
                            MODAL_DATA.register({value: context.options.data});
                            ComponentFactoryResolver(component, null, (componentRef) => {
                                context.componentViewRef = componentRef;
                                modalBody.appendChild(componentRef.nativeElement);
                            });
                        }
                    }, modalContent);
                }
            
                if (context.options.buttons) {
                    DOMHelper.createElement('div', {
                        class: 'modal-footer'
                    }, modalFooter => {
                        // generate the buttons
                        context.options.buttons.forEach((button, idx) => {
                            DOMHelper.createElement('button', {
                                class: button.class,
                                type: 'button',
                                id: (button.id || 'modal_btn_' + idx),
                                data: {
                                    'ref-idx':idx
                                }
                            }, buttonEle => {
                                if (button.iconClass) {
                                    DOMHelper.creabuttonElement('i', {class: button.iconClass}, null, buttonEle);
                                }
                                buttonEle.innerText = button.label;
                            }, modalFooter);
                        });
                    }, modalContent).addEventListener('click', event => {
                        var clickBtn = event.target.closest('button');
                        if (clickBtn) {
                            var buttonDefinition = context.options.buttons[clickBtn.dataset.refIdx];
                            if (buttonDefinition){
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
function ModalInstance(options) {
    this.componentViewRef = null;
    this.modalId = options.id || 'modal_' + +new Date;
    this.options = Object.assign({
        backDrop: true,
        backDropClose: true,
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
        title: ''
    }, options);
    this.componentInstance = null;
    this.onModalClosed = new EventEmitter();
    this.onButtonClicked = new EventEmitter();
    // create overlay
    this.nativeElement = createModalElement(this);
    if (this.options.backDrop) {
        this.overlay = document.createElement('div');
        this.overlay.classList.add('modal-backdrop', 'fade');
        this.overlay.addEventListener('click', () => this.close(true));
    }
}

ModalInstance.prototype.open = function () {
    if (this.overlay) {
        document.body.appendChild(this.overlay);
        this.overlay.classList.add('show');
    }

    this.nativeElement.classList.toggle('show');
}

ModalInstance.prototype.close = function (fromOverlay) {
    if (fromOverlay && !this.options.backDropClose) return;
    animate.fadeOut(this.nativeElement, 1000, () => {
        DOMHelper.remove(this.componentViewRef);
        if (this.options.backDrop) {
            this.overlay.classList.toggle('show');
            if (this.overlay.parentElement)
                this.overlay.parentElement.removeChild(this.overlay);
        }

        this.nativeElement.parentElement.removeChild(this.nativeElement);
        this.cleanUp();
    });
    this.onModalClosed.emit(this.modalId);
}

ModalInstance.prototype.cleanUp = function(){
    this.nativeElement = null;
    this.options = null;
    this.overlay = null;
    this.onModalClosed.destroy();
    this.onButtonClicked.destroy();
}

Service()
export class ModalService {
    constructor(){ }
    createModal(modalOptions) {
        return new ModalInstance(modalOptions);
    };
}