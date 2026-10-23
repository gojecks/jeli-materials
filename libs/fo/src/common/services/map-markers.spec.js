// plain-CJS package: load the ES module source in a sandbox instead of importing it
const { readFileSync } = require('fs');
const vm = require('vm');
const sandbox = {};
vm.runInNewContext(readFileSync(__dirname + '/map-markers.js', 'utf8').replace('export class', 'class') + '\nthis.MapMarkers = MapMarkers;', sandbox);
const { MapMarkers } = sandbox;

describe('MapMarkers', () => {
    it('clusters automatically only above the threshold', () => {
        expect(MapMarkers.shouldCluster({}, 40)).toBe(false);
        expect(MapMarkers.shouldCluster({}, 41)).toBe(true);
        expect(MapMarkers.shouldCluster({ clusterThreshold: 10 }, 11)).toBe(true);
        expect(MapMarkers.shouldCluster({ cluster: 'auto' }, 5)).toBe(false);
    });

    it('can be forced on or off, including the settings panel strings', () => {
        expect(MapMarkers.shouldCluster({ cluster: true }, 2)).toBe(true);
        expect(MapMarkers.shouldCluster({ cluster: 'true' }, 2)).toBe(true);
        expect(MapMarkers.shouldCluster({ cluster: true }, 1)).toBe(false);
        expect(MapMarkers.shouldCluster({ cluster: 'false' }, 500)).toBe(false);
        expect(MapMarkers.clusterRadius({})).toBe(50);
        expect(MapMarkers.clusterRadius({ clusterRadius: '80' })).toBe(80);
    });

    it('matches markers by id, falling back to position', () => {
        expect(MapMarkers.key({ id: 7 }, 0)).toBe('7');
        expect(MapMarkers.key({}, 3)).toBe('i3');
        expect(MapMarkers.isHighlighted({ id: 7 }, 0, '7')).toBe(true);
        expect(MapMarkers.isHighlighted({ id: 7 }, 0, 7)).toBe(true);
        expect(MapMarkers.isHighlighted({ id: 7 }, 0, null)).toBe(false);
        expect(MapMarkers.isHighlighted({}, 2, 'i2')).toBe(true);
    });
});
