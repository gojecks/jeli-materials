Service()
export function NetworkService() {
    this.isOnline = function(cb) {
        if (window.cordova) {
            navigator.connection.getInfo(function(state) {
                cb(![Connection.NONE, Connection.UNKNOWN].includes(state));
            }, function() {
                cb(false);
            });
        } else {
            cb(navigator.onLine);
        }
    }
}