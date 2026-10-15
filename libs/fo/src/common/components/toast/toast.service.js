import {
    DOMHelper,
} from '@jeli/core';

Service()
export class ToastService {
    static show(config) {
        config = Object.assign({
            containerClass: 'bottom-0 end-0',
            autoClose: 2000,
            showToast: true,
            bgClass: '',
            hideBody: false,
            type: 'success'
        }, config || {});

        let timerId = null;
        const closeToast = () => {
            element.firstChild.classList.toggle('show');
            setTimeout(() => document.body.removeChild(element), 500);
            clearTimeout(timerId);
        };

        const element = DOMHelper.createElement('fo-toast', {
            class: `toast-container position-fixed ${config.containerClass || 'bottom-0 end-0'}`
        }, root => {
            root.appendChild(
                DOMHelper.createElement('div', {
                    class: `toast fade text-bg-${config.type || 'success'}`,
                    role: "alert",
                    'aria-live': "assertive",
                    'aria-atomic': "true"
                }, toast => {
                    if (config.title) {
                        toast.appendChild(
                            DOMHelper.createElement('div', {
                                class: 'toast-header'
                            }, header => {
                                header.appendChild(
                                    DOMHelper.createElement('div', {
                                        class: 'me-auto'
                                    }, headerTitle => {
                                        headerTitle.appendChild(
                                            DOMHelper.createElement('span', {}, span => (span.innerHTML = config.title || ' Toast '))
                                        )
                                    })
                                );
                                header.appendChild(
                                    DOMHelper.createElement('button', {
                                        type: 'button',
                                        class: 'btn-close',
                                        'aria-label': 'Close toast'
                                    }, closeBtn => {
                                        closeBtn.addEventListener('click', closeToast);
                                    })
                                )
                            })
                        );
                    }

                    if (!config.hideBody && config.content) {
                        toast.appendChild(
                            DOMHelper.createElement('div', {
                                class: 'toast-body'
                            }, toastBody => {
                                toastBody.innerHTML = config.content;
                            })
                        )
                    }
                })
            )
        });


        document.body.appendChild(element);
        element.firstChild.classList.toggle('show'); // show the toast

        if (config.autoClose && typeof config.autoClose == 'number') {
            timerId = setTimeout(closeToast, config.autoClose);
        }
    }

    static simple(title, content, type) {
        return this.show({
            title,
            content,
            type
        });
    }

    static error(content, title){
        return this.simple(title, content, 'danger');
    }

    static success(content, title){
        return this.simple(title, content, 'success');
    }

    static info(content, title){
        return this.simple(title, content, 'info');
    }

    static warning(content, title){
        return this.simple(title, content, 'warning');
    }
}