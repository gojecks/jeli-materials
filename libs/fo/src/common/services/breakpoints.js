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

    var breakPointValues = Object.keys(breakPoints).reduce((accum, key) => {
        if(mediaQueries[key])
            accum[mediaQueries[key]] = breakPoints[key];
        else if(typeof key == 'number')
            accum[key] = breakPoints[key];

        return accum;
    }, {});
    return MediaQueryEvent(Object.keys(breakPointValues), (mediaEvent, screenSize) => {
        console.log(`Media breakpoint changed to size ${screenSize}`);
        callback(breakPointValues[screenSize])
    });
}