import { animate } from '@jeli/core';
import { registerQueryEvent } from './breakpoints';

/**
 * 
 * @param {*} parentElement 
 * @param {*} config 
 * @param {*} onInitialize 
 */
export function SwiperService(parentElement, config, onInitialize) {
    this.start = 0;
    this.end = 0;
    this.itemPerPage = 1;
    this.config = config;
    this.interval = null;
    this.queryListeners = () => { };
    this.isPlaying = false;

    this.getChildElement = function (index) {
        return parentElement.children[index];
    };

    Object.defineProperty(this, 'total', {
        get: () => parentElement.children.length - 1
    });

    // initialize our carousel
    this._init(onInitialize);
}

SwiperService.prototype.showMatchOnly = function (filterValue) {
    for (var i = 0; i <= this.total; i++) {
        var item = this.getChildElement(i);
        var isHidden = (item.style.display == 'none');
        var articleCat = item.getAttribute(this.config.filter.selector);
        var isMatch = (filterValue == articleCat);
        if (this.config.filter.showOnValues.includes(filterValue) || isMatch) {
            animate.show(item);
            continue;
        }

        if (!isMatch && !isHidden)
            animate.hide(item);
    }
}

SwiperService.prototype.toggle = function (start, end, animation) {
    for (; start <= end; start++) {
        var item = this.getChildElement(start);
        if (!item) continue;

        animate[animation](item);
    }
}

SwiperService.prototype.playOrPause = function () {
    if (this.config.carousel.autoPlay) {
        if (!this.isPlaying) {
            this.interval = setInterval(() => this.next(), this.config.carousel.interval || 3000);
        } else {
            clearInterval(this.interval);
        }

        // set playing flag
        this.isPlaying = !this.isPlaying;
    }
}


SwiperService.prototype._init = function (onInitialize) {
    if (this.config.carousel.enabled) {
        this.queryListeners = registerQueryEvent(this.config.carousel.breakPoints, size => {
            if (size) {
                this.itemPerPage = size;
                if ((this.end - this.start) > size)
                    this.end -= this.itemPerPage;
            }
        });
    }

    // kick off initial
    var initialInterVal = setInterval(() => {
        if (-1 < this.total) {
            onInitialize && onInitialize();
            clearInterval(initialInterVal);
            if (this.config.carousel.enabled) {
                this.toggle(this.itemPerPage, this.total, 'hide');
                this.playOrPause();
            }
        }
    }, 1);
}

SwiperService.prototype.next = function () {
    this.toggle(this.start, this.end, 'fadeOut');
    if (this.end >= this.total) {
        this.start = 0;
        this.end = this.itemPerPage - 1;
    } else {
        this.start = this.end + 1;
        this.end += this.itemPerPage
    }
    this.toggle(this.start, this.end, 'fadeIn');
}

SwiperService.prototype.previous = function () {
    this.toggle(this.start, this.end, 'fadeOut');
    if (this.start <= 0) {
        this.start = this.total - this.end;
        this.end = this.total;
    } else {
        this.end = this.start - 1;
        this.start -= this.itemPerPage;
    }

    this.toggle(this.start, this.end, 'fadeIn');
}

SwiperService.prototype.destroy = function () {
    this.config = null;
    // destroy the listener
    this.queryListeners();
    clearInterval(this.interval);
}