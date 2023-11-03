import { EventEmitter } from '@jeli/core';
var RATE_CACHE_ID = '[[RATINGS]]'

Element({
    selector: 'fo-ratings',
    templateUrl: './rating.element.html',
    styleUrl: './rating.element.scss',
    props: ['ratings', 'rateId', 'showProgress', 'size', 'bgClass'],
    events: [
        'onUserRate:emitter'
    ]
})
export function RatingElement() {
    this.onUserRate = new EventEmitter();
    this._ratings = {};
    this.stars = new Array(5).fill(0).map((n, idx) => (idx + 1));
    this.ratings = null;
    this.totalRatings = 0;
    this.percentage = 0;
    this.size = 3;
    this.showProgress = true;
    this.isRated = false;
    this._bgClass = { 5: 'warning', 4: 'warning', 3: 'warning', 2: 'warning', 1: 'warning' };
    this._userRateCache = JSON.parse(localStorage.getItem(RATE_CACHE_ID) || '{}');

    Object.defineProperty(this, 'ratings', {
        set: function(value) {
            if (!value) return;
            this._ratings = value;
        },
        get: function() {
            return this._ratings
        }
    });

    Object.defineProperty(this, 'bgClass', {
        get: function() {
            return this._bgClass;
        },
        set: function(value) {
            if (!value) return;
            this._bgClass = value;
        }
    })
}

RatingElement.prototype.didInit = function() {
    /**
     * ratings obj should be in this format
     * {rate(n): count(n)}
     */
    this.calculate();
}

RatingElement.prototype.submitRatings = function(star) {
    if (this.rateId && !this._userRateCache.hasOwnProperty(this.rateId)) {
        // set the user rating count
        this._userRateCache[this.rateId] = star;
        this._ratings[star] += 1;
        this.onUserRate.emit({
            rateId: this.rateId,
            star: star
        });
        this.calculate();
        //store the user rate locally
        localStorage.setItem(RATE_CACHE_ID, JSON.stringify(this._userRateCache));
    }
}

RatingElement.prototype.calculate = function() {
    var totalStars = 0;
    var star = 0;
    while (star < 5) {
        star++;
        var starValue = this.ratings[star] || 0;
        this.totalRatings += starValue;
        totalStars += (star * starValue);
        this.percentage = (totalStars / this.totalRatings).toPrecision(3);
        if (this.percentage.toString().split('.')[1] == 0)
            this.percentage = Number(this.percentage).toPrecision(1);
        this._ratings[star] = starValue;
    }
}