import {
    ComponentFactoryResolver,
    EventEmitter,
    animate,
    ProviderToken,
    DOMHelper,
    AttributeAppender
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
        },
        data: {
            'bs-theme': context.options.theme || 'light'
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
                            DOMHelper.createElement('h5', { class: 'modal-title' }, title => {
                                const writeValue = (value) => (title.innerHTML = parseValue(value, context.options.data, null, '-'));
                                if(typeof context.options.title === 'function'){
                                    context._listeners.push([ () => writeValue(context.options.title()) ]);
                                    writeValue(context.options.title());
                                } else {
                                    writeValue(context.options.title);
                                }
                            }, modalHeader);
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
                        const listeners = []
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
                                    DOMHelper.createElement('i', { class: action.iconClass }, null, buttonEle);
                                }
                                
                                const spanEle =  DOMHelper.createElement('span', {}, null, buttonEle);
                                if (typeof action.label === 'function') {
                                    listeners.push(() => spanEle.innerHTML = action.label());
                                    spanEle.innerHTML = action.label() || '....'; // write quick
                                } else {
                                    spanEle.innerHTML = action.label;
                                }

                                // attach event listener
                                if (action.attrs) {
                                    const attrKeys = Object.keys(action.attrs);
                                    listeners.push(() => attrKeys.forEach(attr => {
                                        AttributeAppender.setValue(buttonEle, attr, action.attrs[attr](), true);
                                    }));
                                }
                            }, modalFooter);
                        });

                        // if listeners length
                        if (listeners.length) {
                            context._listeners.push(listeners);
                        }
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

                                if (actionDefinition.dismiss) {
                                    if (!stopPropagation)
                                        context.close();
                                    else if (stopPropagation instanceof Promise)
                                        stopPropagation.then(() => context.close())
                                }
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
            bodyScrollable: false,
            customClass: {
                content: '',
                header: '',
                body: '',
                footer: ''
            },
            theme: ModalService.defaultTheme,
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

    _listeners = [];
    _interval = null;
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
        if (this.isOpened) return this;

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

        // hide body scroll bar
        if (!this.options.bodyScrollable) {
            const parent = this.nativeElement.parentElement;
            parent.setAttribute('data-fo-overflow', parent.style.overflow);
            parent.style.overflow = 'hidden';
        }

        // attach interval
        if (this._listeners.length) {
            this._interval = setInterval(() => {
                for (const listeners of this._listeners) {
                    listeners.forEach(listener => listener());
                }
            }, 500);
        }

        return this;
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
            const parentElement = this.nativeElement?.parentElement;
            parentElement && parentElement.removeChild(this.nativeElement);
            if (!fromRefresh) {
                // restore the old overflow mode
                if (!this.options.bodyScrollable) {
                    const oldValue = parentElement.dataset.foOverflow
                    parentElement.style.overflow = oldValue;
                    parentElement.removeAttribute('data-fo-overflow');
                }
                this.nativeElement = null;
                this.options = null;
                this.overlay = null;
                this.onModalClosed.destroy();
                this.onButtonClicked.destroy();
                this.onModalOpened.destroy();
                openedModalInstances.delete(this.modalId);
                this._listeners.length = 0;
                clearInterval(this._interval); // clear interval
            }
            if (typeof callback == 'function') callback();
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
    static defaultTheme = 'light';
    static setTheme(theme) {
        this.defaultTheme = theme;
    }

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