// marker helpers shared by <fo-maplibre> and <fo-google-markers>
export class MapMarkers {
    static get DEFAULT_CLUSTER_THRESHOLD() {
        return 40;
    }

    // config.cluster: true/"true", false/"false", or "auto" (default) = only above clusterThreshold markers
    static shouldCluster(config, count) {
        var cluster = config ? config.cluster : undefined;
        if (cluster === true || cluster === 'true') return count > 1;
        if (cluster === false || cluster === 'false') return false;
        var threshold = Number(config && config.clusterThreshold) || MapMarkers.DEFAULT_CLUSTER_THRESHOLD;
        return count > threshold;
    }

    static clusterRadius(config) {
        return Number(config && config.clusterRadius) || 50;
    }

    // a marker's identity for highlighting: its "id", else its position in the list
    static key(marker, index) {
        return marker && marker.id !== undefined && marker.id !== null && marker.id !== '' ? String(marker.id) : 'i' + index;
    }

    static isHighlighted(marker, index, highlight) {
        return highlight !== undefined && highlight !== null && highlight !== '' && MapMarkers.key(marker, index) === String(highlight);
    }
}
