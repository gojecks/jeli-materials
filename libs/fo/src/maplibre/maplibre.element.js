import { EventEmitter, LazyLoader } from '@jeli/core';
import { MapBounds } from '../common/services/map-bounds';
import { MapMarkers } from '../common/services/map-markers';

// markers on an open-source MapLibre map; free OpenFreeMap tiles unless config.styleUrl says otherwise.
// Clusters through MapLibre's own GeoJSON clustering (see MapMarkers.shouldCluster), drawn as HTML markers.
Element({
    selector: 'fo-maplibre',
    templateUrl: './maplibre.element.html',
    styleUrl: './maplibre.element.scss',
    props: ['markers', 'config', 'popup', 'highlight'],
    viewChild: ['canvas:HTMLElement=#canvas'],
    events: ['markerClick:emitter', 'boundsChange:emitter', 'mapError:emitter']
})
export class FoMapLibreElement {
    static get VERSION() {
        return '4.7.1';
    }

    static get CDN() {
        return 'https://cdn.jsdelivr.net/npm/maplibre-gl@' + FoMapLibreElement.VERSION + '/dist/maplibre-gl';
    }

    static get DEFAULT_STYLE() {
        return 'https://tiles.openfreemap.org/styles/liberty';
    }

    // the MapLibre script and stylesheet, loaded once per page through LazyLoader's cache; one call per
    // type, since LazyLoader reuses the first entry's type for a whole call. The map sizes its canvas from
    // the stylesheet, so both must be in before a map is created.
    static load() {
        var css = new Promise(resolve => LazyLoader.staticLoader([{ url: FoMapLibreElement.CDN + '.css' }], () => resolve(), 'css'));
        var js = window.maplibregl ? Promise.resolve() : new Promise((resolve, reject) => LazyLoader.staticLoader(
            [{ url: FoMapLibreElement.CDN + '.js' }],
            () => window.maplibregl ? resolve() : reject(new Error('MapLibre did not load')),
            'js'
        ));
        return Promise.all([css, js]);
    }

    static get SOURCE_ID() {
        return 'fo-maplibre-points';
    }

    constructor() {
        this.markerClick = new EventEmitter();
        this.boundsChange = new EventEmitter();
        this.mapError = new EventEmitter();
        this.canvas = null;
        this.config = {};
        this.popup = null;
        this.map = null;
        this.mapPopup = null;
        this.ready = false;
        this.clustered = false;
        // key -> {handle, element, marker?}; points keyed by MapMarkers.key, clusters by "c<id>"
        this.shown = new Map();
        this._markers = [];
        this._highlight = null;
        this._destroyed = false;
        this.resizeObserver = null;
    }

    get markers() {
        return this._markers;
    }

    // a new array re-renders and re-fits the map
    set markers(value) {
        this._markers = MapBounds.validMarkers(value);
        if (this.ready) this.render();
    }

    get highlight() {
        return this._highlight;
    }

    // key of the marker to show as active (see MapMarkers.key)
    set highlight(value) {
        this._highlight = value;
        this.applyHighlight();
    }

    viewDidLoad() {
        FoMapLibreElement.load().then(() => {
            if (this._destroyed) return;
            var lib = window.maplibregl;
            this.map = new lib.Map({ container: this.canvas, style: this.config.styleUrl || FoMapLibreElement.DEFAULT_STYLE, center: [0, 0], zoom: 1 });
            this.map.addControl(new lib.NavigationControl({ showCompass: false }));
            this.mapPopup = new lib.Popup({ offset: 18, maxWidth: '240px' });
            // only user gestures carry an originalEvent; fitBounds/jumpTo don't
            var moved = event => event && event.originalEvent && this.boundsChange.emit(this.getBounds());
            this.map.on('dragend', moved);
            this.map.on('zoomend', moved);
            this.map.on('moveend', () => this.clustered && this.refreshClusters());
            this.map.on('sourcedata', event => {
                if (this.clustered && event.sourceId === FoMapLibreElement.SOURCE_ID && event.isSourceLoaded) this.refreshClusters();
            });
            // keeps the canvas matching its box, e.g. when the page switches into a split layout
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => this.map && this.map.resize());
                this.resizeObserver.observe(this.canvas);
            }
            // sources can only be added once the style has loaded
            this.map.on('load', () => {
                this.map.resize();
                this.ready = true;
                this.render();
            });
        }, err => this.mapError.emit(err));
    }

    render() {
        this.clearShown();
        this.removeSource();
        this.clustered = MapMarkers.shouldCluster(this.config, this._markers.length);
        if (this.clustered) this.addSource();
        else this._markers.forEach((marker, index) => this.showPoint(marker, index));
        this.fit();
    }

    addSource() {
        this.map.addSource(FoMapLibreElement.SOURCE_ID, {
            type: 'geojson',
            cluster: true,
            clusterRadius: MapMarkers.clusterRadius(this.config),
            clusterMaxZoom: 16,
            data: {
                type: 'FeatureCollection',
                features: this._markers.map((marker, index) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [Number(marker.lng), Number(marker.lat)] },
                    properties: { i: index }
                }))
            }
        });
        // invisible layer so MapLibre loads the source; markers are drawn as HTML in refreshClusters()
        this.map.addLayer({ id: FoMapLibreElement.SOURCE_ID, type: 'circle', source: FoMapLibreElement.SOURCE_ID, paint: { 'circle-opacity': 0, 'circle-radius': 1 } });
    }

    removeSource() {
        if (!this.map) return;
        if (this.map.getLayer(FoMapLibreElement.SOURCE_ID)) this.map.removeLayer(FoMapLibreElement.SOURCE_ID);
        if (this.map.getSource(FoMapLibreElement.SOURCE_ID)) this.map.removeSource(FoMapLibreElement.SOURCE_ID);
    }

    // shows a bubble per visible cluster and a marker per unclustered point
    refreshClusters() {
        var source = this.map.getSource(FoMapLibreElement.SOURCE_ID);
        if (!source) return;
        var wanted = new Set();
        this.map.querySourceFeatures(FoMapLibreElement.SOURCE_ID).forEach(feature => {
            var props = feature.properties || {};
            if (props.cluster) {
                var key = 'c' + props.cluster_id;
                if (wanted.has(key)) return;
                wanted.add(key);
                if (!this.shown.has(key)) this.showCluster(key, props, feature.geometry.coordinates, source);
                return;
            }
            var marker = this._markers[props.i];
            if (!marker) return;
            var pointKey = MapMarkers.key(marker, props.i);
            if (wanted.has(pointKey)) return;
            wanted.add(pointKey);
            if (!this.shown.has(pointKey)) this.showPoint(marker, props.i);
        });
        this.shown.forEach((entry, key) => {
            if (wanted.has(key)) return;
            entry.handle.remove();
            this.shown.delete(key);
        });
    }

    showCluster(key, props, coordinates, source) {
        var bubble = document.createElement('div');
        bubble.className = 'fo-map-cluster';
        bubble.textContent = props.point_count_abbreviated || props.point_count;
        var handle = new window.maplibregl.Marker({ element: bubble }).setLngLat(coordinates).addTo(this.map);
        bubble.addEventListener('click', event => {
            event.stopPropagation();
            Promise.resolve(source.getClusterExpansionZoom(props.cluster_id))
                .then(zoom => this.map.easeTo({ center: coordinates, zoom }));
        });
        this.shown.set(key, { handle, element: bubble });
    }

    showPoint(marker, index) {
        var options = {};
        if (marker.label) {
            var pill = document.createElement('div');
            pill.className = 'fo-map-label';
            pill.textContent = marker.label;
            pill.title = marker.title || '';
            options.element = pill;
        }
        var handle = new window.maplibregl.Marker(options).setLngLat([Number(marker.lng), Number(marker.lat)]).addTo(this.map);
        var element = handle.getElement();
        element.addEventListener('click', event => {
            event.stopPropagation();
            this.openPopup(marker, handle);
            this.markerClick.emit(marker);
        });
        var key = MapMarkers.key(marker, index);
        this.shown.set(key, { handle, element, marker, index });
        this.styleHighlight(this.shown.get(key));
    }

    applyHighlight() {
        this.shown.forEach(entry => entry.marker && this.styleHighlight(entry));
    }

    styleHighlight(entry) {
        var active = MapMarkers.isHighlighted(entry.marker, entry.index, this._highlight);
        entry.element.classList.toggle('is-active', active);
        entry.element.style.zIndex = active ? '5' : '';
    }

    clearShown() {
        this.shown.forEach(entry => entry.handle.remove());
        this.shown.clear();
    }

    openPopup(marker, handle) {
        var content = typeof this.popup === 'function' ? this.popup(marker) : null;
        if (!content) return;
        this.mapPopup.setLngLat(handle.getLngLat()).setDOMContent(content).addTo(this.map);
    }

    fit() {
        if (!this.map || !this._markers.length) return;
        var zoom = Number(this.config.zoom) || 14;
        if (this._markers.length === 1) return this.map.jumpTo({ center: [Number(this._markers[0].lng), Number(this._markers[0].lat)], zoom });
        var bounds = new window.maplibregl.LngLatBounds();
        this._markers.forEach(marker => bounds.extend([Number(marker.lng), Number(marker.lat)]));
        this.map.fitBounds(bounds, { padding: Number(this.config.fitPadding) || 48, maxZoom: zoom, duration: 0 });
    }

    getBounds() {
        var bounds = this.map && this.map.getBounds();
        return bounds ? MapBounds.normalize({ north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest() }) : null;
    }

    viewDidDestroy() {
        this._destroyed = true;
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.clearShown();
        if (this.mapPopup) this.mapPopup.remove();
        if (this.map) this.map.remove();
        this.map = null;
    }
}
