import { renderMarkupElements } from "../../../markup.parser";
import { imageSrcset } from "../../../utils";

Element({
    selector: 'fo-carousel',
    templateUrl: './fo-carousel.element.html',
    styleUrl: './fo-carousel.element.scss',
    props: [
        'id',
        'carouselItems',
        'indicator',
        'control',
        'darkVariant',
        'touch',
        'crossFade',
        'timer',
        'ride',
        'defaultTemplate',
        'asBkg'
    ],
    DI: ['changeDetector?']
})
export class FoCarouselElement {
    constructor(changeDetector) {
        this.id = 'foCarousel-' + +new Date;
        this.changeDetector = changeDetector;
        this.currentIndex = 0;
        this.indicator = false;
        this.control = false;
        this.darkVariant = false;
        this.touch = true;
        this.crossFade = false;
        this.carouselItems = [];
        this.timer = 3000;
        this.ride = true;
        this.asBkg = false;
        this._currentTimer = null;

        Object.defineProperty(this, 'indicatorIndexes', {
            get: function () {
                return Object.keys(this.carouselItems || {}).map(Number);
            }
        });
    }
    viewDidLoad() {
        this.startTimer();
    }
    startTimer() {
        if (!this.ride || !this.carouselItems || this.carouselItems.length < 2) return;
        clearTimeout(this._currentTimer);
        var current = this.carouselItems[this.currentIndex];
        this._currentTimer = setTimeout(() => {
            this.next();
            this.changeDetector.onlySelf();
        }, current.interval || this.timer);
    }
    next() {
        this.currentIndex++;
        if (!this.carouselItems[this.currentIndex]) {
            this.currentIndex = 0;
        }
        this.startTimer();
    }
    previous() {
        this.currentIndex--;
        if (!this.carouselItems[this.currentIndex]) {
            this.currentIndex = this.carouselItems.length - 1;
        }
        this.startTimer();
    }
    // swiping is on unless the view sets touch: false
    onSwipe(direction) {
        if (this.touch === false || !this.carouselItems || this.carouselItems.length < 2) return;
        direction === 'left' ? this.next() : this.previous();
        this.changeDetector && this.changeDetector.onlySelf();
    }

        // '' not null - a null srcset property becomes the literal URL "null"
    getSrcset(image) {
        return imageSrcset(image, [640, 1024, 1600, 2400]) || '';
    }

    getCaption(item) {
        return renderMarkupElements((item.caption || this.defaultTemplate || ''), (item.data || item));
    }
}
