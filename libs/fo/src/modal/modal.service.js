import { ComponentFactoryResolver, EventEmitter, animate, ProviderToken, DOMHelper } from '@jeli/core';

export var MODAL_INSTANCE = new ProviderToken('modalInstance', false);
export var MODAL_DATA = new ProviderToken('modalInstance', false)
/**
 * 
 * @param {*} context 
 * @returns 
 */
function createModalElement(context) {
    return DOMHelper.createElement('fo-modal', {
        class: 'modal',
        style: {
            display: context.options.displayType || 'flex'
        }
    }, modalElement => {
        DOMHelper.createElement('div', {
            class: ('modal-dialog ' + (context.options.modalStyle || ''))
        }, modalDialogElement => {
            DOMHelper.createElement('div', {
                class: 'modal-content'
            }, modalContent => {
                if (!context.options.hideHeader) {
                    DOMHelper.createElement('div', {
                        class: 'modal-header'
                    }, modalHeader => {
                        if (context.options.title) {
                            DOMHelper.createElement('h5', { class: 'modal-title'}, context.options.title, modalHeader);
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
                            modalBody.innerHTML = context.options.template;
                        } else if (context.options.component) {
                            // register values to Provider Tokens
                            MODAL_INSTANCE.register({value: context});
                            MODAL_DATA.register({value: context.options.data});
                            ComponentFactoryResolver(context.options.component, null, (componentRef) => {
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
                            buttonDefinition.action(event);
                            if (buttonDefinition.dismiss) {
                                context.close();
                            }
                            buttonDefinition = null;
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
        showHeader: true,
        position: 'center',
        component: null,
        static: null,
        buttons: null,
        hideCloseBtn: false,
        displayType: 'flex',
        title: ''
    }, options);
    this.componentInstance = null;
    this.onModalClosed = new EventEmitter();
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
}

ModalInstance.prototype.close = function (fromOverlay) {
    if (fromOverlay && !this.options.backDropClose) return;
    animate.fadeOut(this.nativeElement, 1, () => {
        DOMHelper.remove(this.componentViewRef);
        if (this.options.backDrop) {
            this.overlay.classList.toggle('show');
            this.overlay.parentElement.removeChild(this.overlay);
        }

        this.nativeElement.parentElement.removeChild(this.nativeElement);
        this.nativeElement = null;
        this.options = null;
        this.overlay = null;
    });
    this.onModalClosed.emit(this.modalId);
}

Service()
export function ModalService() {
    this.createModal = function (modalOptions) {
        return new ModalInstance(modalOptions);
    };
}