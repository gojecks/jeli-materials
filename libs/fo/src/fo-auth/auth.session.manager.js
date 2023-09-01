import { deepClone, deepContext, setCompValue } from "../utils";
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
    this._observers = {};
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

AuthSessionManager.prototype.saveSessionStack = function () {
    if (this.storageProvider.storage && this.storageProvider.storageType in window) {
        for (var stack in this._stack) {
            var value = this._stack[stack]();
            //store the ref data to be retrieve
            if (value) {
                window[this.storageProvider.storageType].setItem(stack, JSON.stringify(value));
            }
        }
    }
};

AuthSessionManager.prototype.addToStack = function (name, fn) {
    if (this._stack && !this._stack.hasOwnProperty(name) && typeof fn === 'function') {
        this._stack[name] = fn;
    }
};

AuthSessionManager.prototype.removeFromStack = function (stackName) {
    if (this._stack.hasOwnProperty(stackName)) {
        delete this._stack[stackName];
    }
};

AuthSessionManager.prototype.destroy = function () {
    this._sessionData = {};
};

AuthSessionManager.prototype.getData = function (key) {
    if (!key) return undefined;
    return deepContext(this._parseKey(key), this._sessionData);
};

AuthSessionManager.prototype.storeData = function (key, value, preserve) {
    if (!key) return;
    key = this._parseKey(key);
    var spltKeys = key.split('.');
    var rootName = spltKeys.shift();
    spltKeys = spltKeys.join('.');
    var rootValue = this._clone(this._sessionData[rootName]);
    setCompValue(key, this._sessionData, value);
    var ignoredIndex = this.ignoreKeysOnReload.indexOf(rootName);
    if (!preserve && 0 > ignoredIndex) {
        this.ignoreKeysOnReload.push(rootName);
    } else if(preserve && -1 < ignoredIndex) {
        this.ignoreKeysOnReload.splice(ignoredIndex, 1);
    }
    
    /**
     * 
     */
    if (this._observers[rootName]) {
        var isDelMode = undefined === value;
        this._observers[rootName].forEach(sub => {
            if (!sub.deepCheck) return sub.callback(value);
            var currentValue = deepContext(sub.stateProp, value);
            var prevValue = deepContext(sub.stateProp, rootValue);
            if (!spltKeys && (currentValue !== prevValue || isDelMode)) return sub.callback(currentValue);
            else if (spltKeys && spltKeys.includes(sub.stateProp)) {
                if (spltKeys !== sub.stateProp) return sub.callback(currentValue);
                else if (prevValue !== value) return sub.callback(value);
            }
        });
    }
};

AuthSessionManager.prototype.getFullState = function (obj) {
    return deepClone(this._sessionData, obj);
}

/**
 * 
 * @param {*} stateProp 
 * @param {*} callback 
 * @returns 
 */
AuthSessionManager.prototype.listenForChanges = function (stateProp, callback) {
    var currentValue = this.getData(stateProp);
    stateProp = this._parseKey(stateProp).split('.');
    var entry = stateProp.shift();
    if (!this._observers[entry]) {
        this._observers[entry] = []
    }

    var subIndex = this._observers[entry].length;
    this._observers[entry].push({
        stateProp: stateProp.join('.'),
        callback,
        deepCheck: !!stateProp.length
    });

    if (currentValue !== undefined) {
        callback(currentValue);
    }

    return () => {
        this._observers[entry].splice(subIndex, 1);
    };
}

/**
 * 
 * @param {*} key 
 * @returns 
 */
AuthSessionManager.prototype._parseKey = function (key) {
    return key.startsWith('@') ? key.substring(1) : key;
}

/**
 * 
 * @param {*} value 
 * @returns 
 */
AuthSessionManager.prototype._clone = function (value) {
    if (value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
}