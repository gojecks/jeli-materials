Element({
    selector: 'fo-carousel',
    templateUrl: './fo-carousel.element.html',
    styleUrl: './fo-carousel.element.scss',
    props: ['id', 'carouselItems', 'indicator', 'control', 'darkVariant', 'touch', 'crossFade', 'timer', 'ride'],
    DI: ['changeDetector?']
})
export function FoCarouselElement(changeDetector) {
    this.id = 'foCarousel-' + +new Date;
    this.changeDetector = changeDetector;
    this.currentIndex = 0;
    this.indicator = false;
    this.control = false;
    this.darkVariant = false;
    this.touch = false;
    this.crossFade = false;
    this.carouselItems = [];
    this.timer = 3000;
    this.ride = true;
    this._currentTimer = null;

    Object.defineProperty(this, 'indicatorIndexes', {
        get: function() {
            return Object.keys(this.carouselItems || {});
        }
    });
}

FoCarouselElement.prototype.viewDidLoad = function() {
    this.startTimer();
}

FoCarouselElement.prototype.startTimer = function() {
    if (!this.ride || this.carouselItems.length === 1) return;
    clearTimeout(this._currentTimer);
    var current = this.carouselItems[this.currentIndex];
    this._currentTimer = setTimeout(() => {
        this.next();
        this.changeDetector.onlySelf();
    }, current.interval || this.timer);
}

FoCarouselElement.prototype.next = function() {
    this.currentIndex++;
    if (!this.carouselItems[this.currentIndex]) {
        this.currentIndex = 0;
    }
    this.startTimer();
}

FoCarouselElement.prototype.previous = function() {
    this.currentIndex--;
    if (!this.carouselItems[this.currentIndex]) {
        this.currentIndex = this.carouselItems.length - 1;
    }
    this.startTimer();
}