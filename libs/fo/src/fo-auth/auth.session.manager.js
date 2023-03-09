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
    this.ignoreKeysOnReload = [];
    this._sessionData = {};
    this.storageProvider = storageProvider;
    this._stack = {
        'auth-reload': () => {
            // remove keys from state before saving
            this.ignoreKeysOnReload.forEach(key => delete this._sessionData[key]);
            return this._sessionData;
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
        window.addEventListener('beforeunload', () => {
            this.saveSessionStack();
        }, false);
    }
}

AuthSessionManager.prototype.saveSessionStack = function() {
    if (this.storageProvider.storage && this.storageProvider.storageType in window) {
        for (var stack in this._stack) {
            var value = this._stack[stack]();
            //store the ref data to be retrieve
            if (value){
                window[this.storageProvider.storageType].setItem(stack, JSON.stringify(value));
            }
        }
    }
};

AuthSessionManager.prototype.addToStack = function(name, fn) {
    if (this._stack && !this._stack.hasOwnProperty(name) && typeof fn === 'function') {
    this._stack[name] = fn;
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

AuthSessionManager.prototype.getData = function(key) {
    key = key.startsWith('@') ? key.split('@')[1] : key;
    return key.split('.').reduce((accum, key) => { if (key && accum) { accum = accum[key] } return accum }, this._sessionData);
};

AuthSessionManager.prototype.storeData = function(key, value, preserve) {
    if (!key) return;
    var state = this._sessionData;
    var isDeleteState = (value === undefined);
    if (key.includes('.')) {
        var props = key.split('.');
        if (!isDeleteState){
            key = props.pop();
            state = props.reduce((accum, key) => {
                if (!accum.hasOwnProperty(key)) {
                    accum[key] = {};
                }
                return (accum = accum[key], accum);
            },state);
        } else {
            key = props.shift();
        }
    }

    if (isDeleteState){
        delete state[key];
    } else {
        state[key] = value;
        if (preserve === false && !this.ignoreKeysOnReload.includes(key)){
            this.ignoreKeysOnReload.push(key);
        }
    }
};

AuthSessionManager.prototype.getFullState = function(){
    return JSON.parse(JSON.stringify(this._sessionData));
}