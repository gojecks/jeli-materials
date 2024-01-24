import { DOMHelper, AttributeAppender } from '@jeli/core';

var EXECUTIONS_ORDER = {
    right: ['right', 'top', 'left', 'bottom'],
    left: ['left', 'bottom', 'right', 'top'],
    top: ['top', 'right', 'bottom', 'left'],
    bottom: ['bottom', 'left', 'top', 'right']
};

/**
 * 
 * @param {*} hostElement 
 */
export function PopOverService(hostElement) {
    this.popOverElement = null;
    this.isVisible = false;
    this.position = "right";
    this.placementOrder = [];

    if (typeof hostElement == 'string')
        hostElement = document.querySelector(hostElement);

    if (!hostElement)
        throw new Error('Host Element is Required in-order for PopOver to function');

    // attach the host Element
    this.hostElement = hostElement;
}

PopOverService.prototype.create = function (config) {
    this.config = config;
    this.position = config.position || "right";
    if (config.fallbackPlacements && config.fallbackPlacements.length) {
        this.placementOrder = config.fallbackPlacements;
    } else {
        this.placementOrder = EXECUTIONS_ORDER[this.position];
    }

    // create and append popover element
    this.popOverElement = DOMHelper.createElement('div', {
        class: 'popover bs-popover-auto position-absolute d-none ' + (config.customClass || ''),
        id: config.id || 'popover_' + (+new Date)
    }, popoverEle => {
        DOMHelper.createElement('div', {
            class: 'popover-arrow position-absolute'
        }, null, popoverEle);

        if (config.title) {
            DOMHelper.createElement('h3', {
                class: 'popover-header'
            }, config.title, popoverEle)
        }

        DOMHelper.createElement('div', {
            class: 'popover-body'
        }, config.content, popoverEle);
    }, document.body);

    // attach listeners
    var triggers = config.dismissible ? 'f' : config.trigger || 'm';
    var allowed = ['m', 'h', 'f'];
    var userDefined = triggers.split(' ');
    if (userDefined.length > 1 && userDefined.includes(allowed[0]) || userDefined.some(t => !allowed.includes(t))) {
        throw new Error('Invalid trigger config, allowed triggers values are "' + allowed.join(',') + '"');
    }

    var attachEventActions = {
        m: () => {
            this.hostElement.addEventListener('click', () => this.open());
        },
        h: () => {
            this.hostElement.addEventListener('mouseover', () => this.open());
            this.hostElement.addEventListener('mouseout', () => this.open());
        },
        f: () => {
            this.hostElement.addEventListener('focusin', () => this.open());
            this.hostElement.addEventListener('focusout', () => this.open());
        }
    };

    // attach events
    userDefined.forEach(event => attachEventActions[event]());
}

PopOverService.prototype.open = function () {
    if (!this.isVisible) {
        this.show()
        this.determinePosition();
    } else {
        this.hide();
    }
    this.isVisible = !this.isVisible;
}

PopOverService.prototype.determinePosition = function () {
    var eleRect = this.hostElement.getBoundingClientRect();
    var eleRectX = eleRect.x;
    var eleRectY = eleRect.y;
    var containerRect = this.popOverElement.parentElement.getBoundingClientRect();
    var popoverRect = this.popOverElement.getBoundingClientRect();
    var arrowHeight = 8; // 10 for arrow
    var popoverHeight = popoverRect.height + arrowHeight;
    var popoverWidth = popoverRect.width + arrowHeight;
    var remWidthFromEle = containerRect.width - eleRectX;
    var popoverHalfSize = (popoverWidth / 2);
    var popoverHeightHalfSize = (popoverRect.height / 2);
    var eleHalfWidth = (eleRect.width / 2);
    var eleHalfHeight = (eleRect.height / 2);
    var arrowPosition = '';
    var arrowCenterPosition = {};

    var getLeft = () => {
        if (popoverWidth > eleRect.width) {
            if (remWidthFromEle >= popoverWidth || remWidthFromEle >= popoverHalfSize) {
                return ((eleRectX + eleHalfWidth) - popoverHalfSize)
            } else {
                return eleRectX - (popoverWidth - remWidthFromEle);
            }
        } else {
            return ((eleRect.width - popoverWidth) / 2) + eleRectX
        }
    };

    var getTop = () => {
        if (popoverHeight > eleRect.height) {
            return (eleRectY - (popoverHeightHalfSize - eleHalfHeight))
        } else {
            return (eleRectY + (eleHalfHeight - popoverHalfSize))
        }
    };

    var actions = {
        top: () => {
            if (((eleRectY - popoverHeight) >= 0) && popoverHalfSize <= remWidthFromEle) {
                arrowPosition = 'top';
                arrowCenterPosition.left = (popoverHalfSize - arrowHeight);
                return {
                    top: eleRectY - popoverHeight,
                    left: getLeft()
                }
            }
        },
        bottom: () => {
            if ((eleRectY + eleRect.height + popoverHeight <= containerRect.height) && popoverHalfSize <= remWidthFromEle) {
                arrowCenterPosition.left = (popoverHalfSize - arrowHeight);
                arrowPosition = 'bottom';
                return {
                    top: (eleRectY + eleRect.height + arrowHeight),
                    left: getLeft()
                }
            }
        },
        left: () => {
            if ((eleRectX >= popoverWidth) && (eleRectY - popoverHeightHalfSize) >= 0) {
                arrowPosition = 'left';
                arrowCenterPosition = {
                    top: popoverHeightHalfSize - arrowHeight,
                    left: '100%'
                };

                return {
                    top: getTop(),
                    left: (eleRectX - popoverWidth)
                }
            }
        },
        right: () => {
            if (((popoverWidth + eleRect.right) <= containerRect.width) && (eleRectY - popoverHeightHalfSize) >= 0) {
                arrowPosition = 'right';
                arrowCenterPosition = {
                    top: popoverHeightHalfSize - arrowHeight
                };

                return {
                    top: getTop(),
                    left: (eleRect.right + arrowHeight)
                }
            }
        }
    };

    var style = null;
    for (var order of this.placementOrder) {
        style = actions[order]();
        if (style) break;
    }

    // both position and fallback placements weren't met
    // we display the element beneath the infoIcon
    if (!style) {
        var isBottomSpace = (containerRect.height >= eleRectY + eleRect.height + popoverHeight);
        style = {
            left: (remWidthFromEle <= popoverWidth ? 
                    (eleRectX - (popoverWidth - remWidthFromEle)) : 
                    (popoverHalfSize > eleRectX ? eleRectX / 2 : eleRectX - popoverHalfSize)),
            top: (isBottomSpace ? (eleRect.y + eleRect.height + arrowHeight) : (eleRect.y - arrowHeight))
        }
        // set arrow position
        arrowPosition = isBottomSpace ? 'bottom' : 'top';
        arrowCenterPosition.left = (remWidthFromEle > eleRectX ? (style.left + eleHalfWidth) : (popoverWidth - remWidthFromEle + eleHalfWidth)) - arrowHeight;
    }

    AttributeAppender(this.popOverElement, {
        style,
        data: {
            'popper-placement': arrowPosition
        }
    });

    // style arrowPointer position 
    AttributeAppender(this.popOverElement.querySelector('.popover-arrow'), {
        style: arrowCenterPosition
    });
}

PopOverService.prototype.toggle = function () {
    this.show();
    this.hide();
}

PopOverService.prototype.show = function () {
    if (!this.isVisible) {
        this.popOverElement.classList.toggle('d-none');
    }
}

PopOverService.prototype.hide = function () {
    if (this.isVisible) {
        this.popOverElement.classList.toggle('d-none');
        this.popOverElement.removeAttribute('style');
        this.popOverElement.querySelector('.popover-arrow').removeAttribute('style');
    }
}

PopOverService.prototype.destroy = function () {
    this.hostElement = null;
    this.popOverElement.parentElement.removeChild(this.popOverElement);
    this.popOverElement = null;
}