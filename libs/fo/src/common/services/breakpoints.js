import { MediaQueryEvent } from '@jeli/core';

export var mediaQueries = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
};

export function registerQueryEvent(breakPoints, callback){
    breakPoints = breakPoints || {
        'sm': 1,
        'md': 2,
        'lg': 3
    };

    var fallbackSize = 0;
    if (breakPoints.hasOwnProperty('xs')){
        var windowWidth = window.innerWidth;
        if (windowWidth < mediaQueries.sm)
            fallbackSize = windowWidth;
    }

    var breakPointValues = Object.keys(breakPoints).reduce((accum, key) => {
        var mediaSize = mediaQueries[key] || fallbackSize || ((typeof key == 'number') ? key : 0);
        if (mediaSize) accum[mediaSize] = breakPoints[key];
        return accum;
    }, {});

    return MediaQueryEvent(Object.keys(breakPointValues), (mediaEvent, screenSize) => {
        if (mediaEvent.matches) {
            console.log(`Media breakpoint changed to size ${screenSize}`);
            callback(Number(breakPointValues[screenSize]));
        }
    });
}