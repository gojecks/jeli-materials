// {north, south, east, west} with longitudes kept inside -180..180
export class MapBounds {
    static normalize(bounds) {
        if (!bounds) return null;
        if (bounds.east - bounds.west >= 360) return Object.assign({}, bounds, { west: -180, east: 180 });
        var wrap = lng => ((lng + 540) % 360) - 180;
        return Object.assign({}, bounds, { west: wrap(bounds.west), east: wrap(bounds.east) });
    }

    // drops markers without usable coordinates
    static validMarkers(markers) {
        return (Array.isArray(markers) ? markers : []).filter(marker => marker
            && isFinite(marker.lat) && isFinite(marker.lng) && Math.abs(marker.lat) <= 90 && Math.abs(marker.lng) <= 180);
    }
}
