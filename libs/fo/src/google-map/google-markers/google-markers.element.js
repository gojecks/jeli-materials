import { EventEmitter, LazyLoader } from '@jeli/core';
import { GoogleMapService } from '../geo-service';
import { MapBounds } from '../../common/services/map-bounds';
import { MapMarkers } from '../../common/services/map-markers';

// markers on a Google map; same inputs and events as <fo-maplibre>, loaded through the app's Google Maps key
Element({
    selector: 'fo-google-markers',
    templateUrl: './google-markers.element.html',
    styleUrl: './google-markers.element.scss',
    props: ['markers', 'config', 'popup', 'highlight'],
    viewChild: ['canvas:HTMLElement=#canvas'],
    events: ['markerClick:emitter', 'boundsChange:emitter', 'mapError:emitter']
})
export class GoogleMarkersElement {
    static get LOAD_TIMEOUT_MS() {
        return 15000;
    }

    static get CLUSTERER_URL() {
        return 'https://cdn.jsdelivr.net/npm/@googlemaps/markerclusterer@2.5.3/dist/index.umd.min.js';
    }

    // Google's marker clusterer; resolves false when it can't load, so the map shows plain markers
    static loadClusterer() {
        if (window.markerClusterer) return Promise.resolve(true);
        return new Promise(resolve => LazyLoader.staticLoader([{ url: GoogleMarkersElement.CLUSTERER_URL }], () => resolve(!!window.markerClusterer), 'js'));
    }

    // resolves once the script loaded by GoogleMapModule.setKey() is ready; fails when no key was set
    static load() {
        return new Promise((resolve, reject) => {
            var timer = setTimeout(() => reject(new Error('Google Maps did not load')), GoogleMarkersElement.LOAD_TIMEOUT_MS);
            GoogleMapService.checkModuleLoaded(() => {
                clearTimeout(timer);
                window.google && window.google.maps ? resolve() : reject(new Error('Google Maps did not load'));
            });
        });
    }

    constructor() {
        this.markerClick = new EventEmitter();
        this.boundsChange = new EventEmitter();
        this.mapError = new EventEmitter();
        this.canvas = null;
        this.config = {};
        this.popup = null;
        this.map = null;
        this.infoWindow = null;
        this.rendered = [];
        this.clusterer = null;
        this.fitting = false;
        this._highlight = null;
        this._renderId = 0;
        this._markers = [];
        this._destroyed = false;
    }

    get markers() {
        return this._markers;
    }

    // a new array re-renders and re-fits the map
    set markers(value) {
        this._markers = MapBounds.validMarkers(value);
        if (this.map) this.render();
    }

    get highlight() {
        return this._highlight;
    }

    // key of the marker to show as active (see MapMarkers.key)
    set highlight(value) {
        this._highlight = value;
        this.rendered.forEach(entry => this.styleHighlight(entry));
    }

    viewDidLoad() {
        GoogleMarkersElement.load().then(() => {
            if (this._destroyed) return;
            var maps = window.google.maps;
            this.map = new maps.Map(this.canvas, { zoom: Number(this.config.zoom) || 14, center: { lat: 0, lng: 0 }, mapTypeControl: false, streetViewControl: false });
            this.infoWindow = new maps.InfoWindow();
            var moved = () => !this.fitting && this.boundsChange.emit(this.getBounds());
            this.map.addListener('dragend', moved);
            this.map.addListener('zoom_changed', moved);
            this.map.addListener('idle', () => (this.fitting = false));
            this.render();
        }, err => this.mapError.emit(err));
    }

    render() {
        var maps = window.google.maps;
        var renderId = ++this._renderId;
        this.clearRendered();
        var cluster = MapMarkers.shouldCluster(this.config, this._markers.length);
        this.rendered = this._markers.map((marker, index) => {
            var handle = new maps.Marker({
                map: cluster ? null : this.map,
                position: { lat: Number(marker.lat), lng: Number(marker.lng) },
                title: marker.title || '',
                label: marker.label ? { text: marker.label, className: 'fo-map-label' } : undefined,
                icon: marker.label ? { path: maps.SymbolPath.CIRCLE, scale: 0 } : undefined
            });
            handle.addListener('click', () => {
                this.openPopup(marker, handle);
                this.markerClick.emit(marker);
            });
            var entry = { marker, index, handle };
            this.styleHighlight(entry);
            return entry;
        });
        if (cluster) {
            GoogleMarkersElement.loadClusterer().then(loaded => {
                if (renderId !== this._renderId || !this.map) return;
                var handles = this.rendered.map(entry => entry.handle);
                if (loaded) this.clusterer = new window.markerClusterer.MarkerClusterer({ map: this.map, markers: handles });
                else handles.forEach(handle => handle.setMap(this.map));
            });
        }
        this.fit();
    }

    styleHighlight(entry) {
        var active = MapMarkers.isHighlighted(entry.marker, entry.index, this._highlight);
        entry.handle.setZIndex(active ? 1000 : null);
        if (entry.marker.label) entry.handle.setLabel({ text: entry.marker.label, className: 'fo-map-label' + (active ? ' is-active' : '') });
        else entry.handle.setAnimation(active ? window.google.maps.Animation.BOUNCE : null);
    }

    clearRendered() {
        if (this.clusterer) this.clusterer.clearMarkers();
        this.clusterer = null;
        this.rendered.forEach(entry => entry.handle.setMap(null));
        this.rendered = [];
    }

    openPopup(marker, handle) {
        var content = typeof this.popup === 'function' ? this.popup(marker) : null;
        if (!content) return;
        this.infoWindow.setContent(content);
        this.infoWindow.open({ map: this.map, anchor: handle });
    }

    fit() {
        if (!this.map || !this._markers.length) return;
        this.fitting = true;
        var zoom = Number(this.config.zoom) || 14;
        var position = marker => ({ lat: Number(marker.lat), lng: Number(marker.lng) });
        if (this._markers.length === 1) {
            this.map.setCenter(position(this._markers[0]));
            this.map.setZoom(zoom);
            return;
        }
        var bounds = new window.google.maps.LatLngBounds();
        this._markers.forEach(marker => bounds.extend(position(marker)));
        this.map.fitBounds(bounds);
    }

    getBounds() {
        var bounds = this.map && this.map.getBounds();
        return bounds ? MapBounds.normalize(bounds.toJSON()) : null;
    }

    viewDidDestroy() {
        this._destroyed = true;
        this.clearRendered();
        if (this.infoWindow) this.infoWindow.close();
        if (this.map) window.google.maps.event.clearInstanceListeners(this.map);
        this.map = null;
    }
}
