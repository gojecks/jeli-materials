import { animate } from '@jeli/core';
import { registerQueryEvent } from './breakpoints';

/**
 * 
 * @param {*} parentElement 
 * @param {*} config 
 * @param {*} onInitialize 
 */
/**
 *
 * @param {*} parentElement
 * @param {*} config
 * @param {*} onInitialize
 */
export class SwiperService {
    initialInterVal = null;
    constructor(parentElement, config, onInitialize) {
        this.start = 0;
        this.end = 0;
        this.itemPerPage = 1;
        this.config = config;
        this.interval = null;
        this.queryListeners = () => { };
        this.isPlaying = false;
        this.parentElement = parentElement;
        // initialize our carousel
        this._init(onInitialize);
    }

    // -1 when empty: the old "length - 1 || 0" made an empty list look like -1 forever and the 1ms start-up poll never stopped
    get total(){
        return (this.parentElement ? this.parentElement.children.length : 0) - 1;
    }

    getChildElement(index) {
        return this.parentElement.children[index];
    }

    showMatchOnly(filterValue) {
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
    toggle(start, end, animation) {
        for (; start <= end; start++) {
            var item = this.getChildElement(start);
            if (!item) continue;

            animate[animation](item);
        }
    }
    playOrPause() {
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
    _init(onInitialize) {
        if (this.config.carousel.enabled) {
            this.queryListeners = registerQueryEvent(this.config.carousel.breakPoints, size => {
                if (size) {
                    this.itemPerPage = size;
                    if ((this.end - this.start) > size)
                        this.end -= this.itemPerPage;
                }
            });
        }

        // start once the container has items; next tick, since callers use the instance right after constructing it
        var start = () => {
            if (!this.config || this.total < 0) return false;
            this._stopWatching();
            onInitialize && onInitialize();
            if (this.config.carousel.enabled) {
                this.toggle(this.itemPerPage, this.total, 'hide');
                this.playOrPause();
            }
            return true;
        };
        this.initialInterVal = setTimeout(() => {
            if (start() || !this.parentElement || typeof MutationObserver === 'undefined') return;
            this._childWatcher = new MutationObserver(start);
            this._childWatcher.observe(this.parentElement, { childList: true });
        }, 0);
    }

    _stopWatching() {
        if (this._childWatcher) this._childWatcher.disconnect();
        this._childWatcher = null;
    }

    next() {
        this.toggle(this.start, this.end, 'fadeOut');
        if (this.end >= this.total) {
            this.start = 0;
            this.end = this.itemPerPage - 1;
        } else {
            this.start = this.end + 1;
            this.end += this.itemPerPage;
        }
        this.toggle(this.start, this.end, 'fadeIn');
    }
    previous() {
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
    destroy() {
        this.parentElement = null;
        this.config = null;
        // destroy the listener
        this.queryListeners();
        clearInterval(this.interval);
        clearTimeout(this.initialInterVal);
        this._stopWatching();
    }
}








