import { AUTH_STORAGE_PROVIDER } from "./tokens";

Service({
    DI: [AUTH_STORAGE_PROVIDER]
})


/**
 * Application Auth Manager
 * Manage your authentication information in one service
 * @param {*} storageProvider 
 */
export function AuthSessionManager(storageProvider) {
    var _this = this;
    this._sessionData = {};
    this.storageProvider = storageProvider;
    this._stack = {
        'auth-reload': function() {
            return _this._sessionData;
        }
    };
    // get the storageData
    if (storageProvider.storage) {
        this._sessionData = JSON.parse(window[storageProvider.storageType].getItem('auth-reload') || '{}');
        //remove the cache data
        window[storageProvider.storageType].removeItem('auth-reload');
    }

    /**
     * register eventListener
     */
    if ("onbeforeunload" in window) {
        window.addEventListener('beforeunload', function() {
            _this.saveSessionStack();
        }, false);
    }
}

AuthSessionManager.prototype.saveSessionStack = function() {
    if (this.storageProvider.storage && this.storageProvider.storageType in window) {
        for (var stack in this._stack) {
            //store the ref data to be retrieve
            window[this.storageProvider.storageType].setItem(stack, JSON.stringify(this._stack[stack]()));
        }
    }
};

AuthSessionManager.prototype.addToStack = function(name, fn) {
    if (this._stack && !this._stack.hasOwnProperty(name) && typeof fn === 'function') {
        _stack[name] = fn;
    }
};

AuthSessionManager.prototype.removeFromStack = function(stackName) {
    if (this._stack.hasOwnProperty(stackName)) {
        delete this._stack[stackName];
    }
};

AuthSessionManager.prototype.destroy = function() {
    this._sessionData = {};
};

AuthSessionManager.prototype.getData = function(name) {
    return this._sessionData[name];
};

AuthSessionManager.prototype.storeData = function(name, value) {
    this._sessionData[name] = value;
};

AuthSessionManager.prototype.removeData = function(name) {
    delete this._sessionData[name];
};