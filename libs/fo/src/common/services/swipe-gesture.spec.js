// plain-CJS package: load the ES module source in a sandbox instead of importing it
const { readFileSync } = require('fs');
const vm = require('vm');
const sandbox = {};
vm.runInNewContext(readFileSync(__dirname + '/swipe-gesture.js', 'utf8').replace('export class', 'class') + '\nthis.SwipeGesture = SwipeGesture;', sandbox);
const { SwipeGesture } = sandbox;

describe('SwipeGesture.direction', () => {
    it('reads a quick flick along the dominant axis', () => {
        expect(SwipeGesture.direction(-80, 10, 200)).toBe('left');
        expect(SwipeGesture.direction(80, -5, 200)).toBe('right');
        expect(SwipeGesture.direction(4, -90, 200)).toBe('up');
        expect(SwipeGesture.direction(-6, 70, 200)).toBe('down');
    });

    it('ignores short moves, diagonals and slow short drags', () => {
        expect(SwipeGesture.direction(-30, 0, 100)).toBeNull();
        expect(SwipeGesture.direction(60, 55, 100)).toBeNull();
        expect(SwipeGesture.direction(-60, 0, 900)).toBeNull();
        expect(SwipeGesture.direction(-90, 0, 900)).toBe('left');
    });

    it('takes a custom threshold', () => {
        expect(SwipeGesture.direction(-50, 0, 100, { threshold: 60 })).toBeNull();
        expect(SwipeGesture.direction(-61, 0, 100, { threshold: 60 })).toBe('left');
    });
});

describe('SwipeGesture.allowed', () => {
    it('allows everything by default, or only the listed directions', () => {
        expect(SwipeGesture.allowed('up', '')).toBe(true);
        expect(SwipeGesture.allowed('left', 'left,right')).toBe(true);
        expect(SwipeGesture.allowed('down', 'left, right')).toBe(false);
        expect(SwipeGesture.allowed('down', 'down')).toBe(true);
    });
});
