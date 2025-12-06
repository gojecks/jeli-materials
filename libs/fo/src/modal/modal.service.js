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
export var MODAL_DATA = new ProviderToken('modalInstance', false);

const openedModalInstances = new Map();
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
                                .addEventListener('click', () => context.close(false));
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

                const actions = context.options.buttons || context.options.actions;
                if (actions) {
                    DOMHelper.createElement('div', {
                        class: `modal-footer ${context.options.customClass.footer || ''}`
                    }, modalFooter => {
                        // generate the buttons
                        actions.forEach((action, idx) => {
                            DOMHelper.createElement('button', {
                                class: action.class,
                                type: 'button',
                                id: (action.id || 'modal_btn_' + idx),
                                data: {
                                    'ref-idx': idx
                                }
                            }, buttonEle => {
                                if (action.iconClass) {
                                    DOMHelper.creabuttonElement('i', { class: action.iconClass }, null, buttonEle);
                                }
                                buttonEle.innerText = action.label;
                            }, modalFooter);
                        });
                    }, modalContent).addEventListener('click', event => {
                        const clickBtn = event.target.closest('button');
                        if (clickBtn) {
                            const actionDefinition = actions[clickBtn.dataset.refIdx];
                            let stopPropagation = false;
                            if (actionDefinition) {
                                if ('function' == typeof actionDefinition.action)
                                    stopPropagation = actionDefinition.action(event);
                                else
                                    context.onButtonClicked.emit(actionDefinition);

                                if (actionDefinition.dismiss && !stopPropagation) context.close();
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
    static buildOptions(options) {
        return Object.assign({
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
            actions: null,
            buttons: null, // to be removed, use action instead
            hideCloseBtn: false,
            displayType: 'flex',
            modalStyle: '',
            markup: false,
            data: null,
            title: '',
            closeTimeOut: null,
            openTimeOut: null
        }, options);
    }

    constructor(options) {
        this.componentViewRef = null;
        this.closeTimeout = null;
        this.modalId = options.id || 'modal_' + +new Date;
        this.options = ModalInstance.buildOptions(options);
        this.componentInstance = null;
        this.isOpened = false;
        this.onModalOpened = new EventEmitter();
        this.onModalClosed = new EventEmitter();
        this.onButtonClicked = new EventEmitter();
        if (this.options.backDrop) {
            this.overlay = document.createElement('div');
            this.overlay.classList.add('modal-backdrop', 'fade');
            this.overlay.addEventListener('click', () => this.close(true));
        }

        if (this.options.openTimeOut) {
            setTimeout(() => this.open(), this.options.openTimeOut);
        }

        // set modal instance to map
        openedModalInstances.set(this.modalId, this);
    }

    open() {
        if (this.isOpened) return;

        this.nativeElement = createModalElement(this);
        if (this.overlay) {
            document.body.appendChild(this.overlay);
            this.overlay.classList.add('show');
        }

        this.nativeElement.classList.toggle('show');
        this.onModalOpened.emit(true);
        // activate timeout
        if ('number' === typeof this.options.closeTimeOut) {
            this.closeTimeout = setTimeout(() => this.close(false), this.options.closeTimeOut)
        }

        this.isOpened = false;
    }

    close(fromOverlay, data) {
        if (fromOverlay && !this.options.backDropClose) return;
        clearTimeout(this.closeTimeout);
        if (this.options.backDrop) {
            this.overlay.classList.toggle('show');
            if (this.overlay.parentElement)
                this.overlay.parentElement.removeChild(this.overlay);
        }

        this.cleanUp(false);
        this.onModalClosed.emit({
            id: this.modalId,
            fromOverlay,
            data
        });
    }

    cleanUp(fromRefresh, callback) {
        animate.fadeOut(this.nativeElement, 200, () => {
            DOMHelper.remove(this.componentViewRef);
            this.nativeElement && this.nativeElement.parentElement.removeChild(this.nativeElement);
            if (!fromRefresh) {
                this.nativeElement = null;
                this.options = null;
                this.overlay = null;
                this.onModalClosed.destroy();
                this.onButtonClicked.destroy();
                this.onModalOpened.destroy();
                openedModalInstances.delete(this.modalId);
            }
            if(typeof callback == 'function') callback();
        });
    }

    refresh(options) {
        Object.assign(this.options, options);
        this.cleanUp(true, () => {
            this.nativeElement = createModalElement(this);
            this.nativeElement.classList.toggle('show');
        });
        return this;
    }

    update(options) {
        Object.assign(this.options, options);
        return this;
    }
}


Service()
export class ModalService {
    static destroyAllOpened() {
        Array.from(openedModalInstances.values()).forEach(modal => modal.close());
    }

    static destroyById(id) {
        const modalInstance = openedModalInstances.get(id);
        if (modalInstance) {
            modalInstance.close();
        }
    }

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
            displayType: 'block',
            modalStyle: "modal-dialog-centered modal-sm",
            hideCloseBtn
        }).open();
    }

    /**
     * 
     * @param {*} template 
     * @param {*} actions 
     * @param {*} hideCloseBtn 
     * @returns 
     */
    confirm(template, actions, hideCloseBtn) {
        return this.createModal({
            title: "Please confirm",
            displayType: 'block',
            modalStyle: "modal-dialog-centered modal-sm",
            template,
            actions,
            hideCloseBtn
        }).open();
    }

    /**
     * 
     * @param {*} template 
     * @param {*} actions 
     * @returns 
     */
    prompt(template, actions, hideCloseBtn = false) {
        return this.createModal({
            title: "Prompt",
            displayType: 'block',
            modalStyle: "modal-dialog-centered modal-sm",
            template,
            actions,
            hideCloseBtn
        }).open();
    }
}