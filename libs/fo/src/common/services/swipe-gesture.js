// flick detection shared by the foSwipe directive and anything else that needs it
export class SwipeGesture {
    // distance in px; a slow drag still counts once it covers twice the distance
    static direction(dx, dy, ms, options) {
        var threshold = (options && options.threshold) || 40;
        var ax = Math.abs(dx), ay = Math.abs(dy);
        var distance = Math.max(ax, ay);
        if (distance < threshold) return null;
        if (ms > 600 && distance < threshold * 2) return null;
        if (ax >= ay * 1.5) return dx < 0 ? 'left' : 'right';
        if (ay >= ax * 1.5) return dy < 0 ? 'up' : 'down';
        return null;
    }

    // "" means every direction; otherwise "left,right" / "down"
    static allowed(direction, directions) {
        var list = String(directions || '').split(/[\s,]+/).filter(Boolean);
        return !list.length || list.includes(direction);
    }
}
