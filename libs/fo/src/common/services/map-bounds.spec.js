// plain-CJS package: load the ES module source in a sandbox instead of importing it
const { readFileSync } = require('fs');
const vm = require('vm');
const sandbox = {};
vm.runInNewContext(readFileSync(__dirname + '/map-bounds.js', 'utf8').replace('export class', 'class') + '\nthis.MapBounds = MapBounds;', sandbox);
const { MapBounds } = sandbox;

describe('MapBounds', () => {
    it('keeps longitudes inside -180..180', () => {
        expect(MapBounds.normalize({ north: 1, south: 0, east: 190, west: 170 })).toEqual({ north: 1, south: 0, east: -170, west: 170 });
        expect(MapBounds.normalize({ north: 1, south: 0, east: 101, west: 100 })).toEqual({ north: 1, south: 0, east: 101, west: 100 });
        expect(MapBounds.normalize({ north: 80, south: -80, east: 400, west: -20 })).toEqual({ north: 80, south: -80, east: 180, west: -180 });
        expect(MapBounds.normalize(null)).toBe(null);
    });

    it('drops markers without usable coordinates', () => {
        const markers = [{ lat: 13.7, lng: 100.5 }, { lat: 'x', lng: 1 }, { lat: 95, lng: 1 }, null, { lat: 1 }];
        expect(MapBounds.validMarkers(markers)).toEqual([{ lat: 13.7, lng: 100.5 }]);
        expect(MapBounds.validMarkers(undefined)).toEqual([]);
    });
});
