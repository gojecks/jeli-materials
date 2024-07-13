import { conditionParser$, deepClone, deepContext, setCompValue } from "../utils";
import { AUTH_STORAGE_PROVIDER } from "./tokens";

Service({
    DI: [AUTH_STORAGE_PROVIDER]
})


/**
 * Application Auth Manager
 * Manage your authentication information in one service
 * @param {*} storageProvider 
 */
export class AuthSessionManager {
    constructor(storageProvider) {
        this.ignoreKeysOnReload = [];
        this._sessionData = Object.defineProperties({}, {
            ISODate: {
                get: () => new Date().toISOString().split('.')[0]
            },
            now: {
                get: () => Date.now()
            },
            location: () => location
        });

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
            var sessionData = JSON.parse(window[storageProvider.storageType].getItem('auth-reload') || '{}');
            Object.assign(this._sessionData, sessionData);
            sessionData = null;
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

        console.log('[StateManager] Initialized..');
    }

    saveSessionStack() {
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

    addToStack(name, fn) {
        if (this._stack && !this._stack.hasOwnProperty(name) && typeof fn === 'function') {
            this._stack[name] = fn;
        }
    };

    removeFromStack(stackName) {
        if (this._stack.hasOwnProperty(stackName)) {
            delete this._stack[stackName];
        }
    };

    destroy() {
        this._sessionData = {};
    };

    getData(key) {
        if (!key) return undefined;
        return deepContext(this._parseKey(key), this._sessionData);
    };

    storeData(key, value, preserve) {
        if (!key) return;
        key = this._parseKey(key);
        var spltKeys = key.split('.');
        var rootName = spltKeys.shift();
        spltKeys = spltKeys.join('.');
        setCompValue(key, this._sessionData, value);
        var ignoredIndex = this.ignoreKeysOnReload.indexOf(rootName);
        if (!preserve && 0 > ignoredIndex) {
            this.ignoreKeysOnReload.push(rootName);
        } else if (preserve && -1 < ignoredIndex) {
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
                var prevValue = sub.currentValue;
                // set the currentValue 
                sub.currentValue = currentValue;

                if (!spltKeys && (currentValue !== prevValue || isDelMode))
                    return sub.callback(currentValue);
                else if (spltKeys && spltKeys.includes(sub.stateProp)) {
                    if (spltKeys !== sub.stateProp)
                        return sub.callback(currentValue);
                    else if (prevValue !== value)
                        return sub.callback(value);
                }
            });
        }
    };

    /**
     * 
     * @param {*} updates
     * operators
     *  REMOVE, PUSH, EMPTY, CONDITIONALVALUE, GETBYINDEX
     */
    runMultipleUpdates(updates) {
        if (Array.isArray(updates)) {

            var operations = {
                remove: (value, operation) => {
                    if (!value) return value;
                    if (Array.isArray(value)) value.splice(operation.index, 1);
                    else if ('object' == typeof value) delete value[operation.index];
                    return value;
                },
                push: (value, operation) => {
                    if (!value) value = [];
                    value.push(operation.value);
                    return value;
                },
                empty: (value) => {
                    if (Array.isArray(value)) value.length = 0;
                    else if ('object' == typeof value) value = {};
                    else if ('string' == typeof value) value = '';
                    return value;
                },
                conditionalvalue: (_, operation) => {
                    return conditionParser$.evaluateConditionalValue(operation.value);
                },
                getbyindex: (_, operation) => {
                    var stateValue = this.getData(operation.fromState);
                    if (Array.isArray(stateValue)) {
                        return stateValue[operation.index];
                    }

                    return null;
                }
            };

            var noop = value => value;
            var runUpdates = (update) => {
                if (!update.id) return;
                if (!conditionParser$.parseAndEvaluate(update.condition, this._sessionData)) return;

                // self defined value
                var value = update.value;
                if (update.operation) {
                    value = this.getData(update.id);
                    value = (operations[update.operation.toLowerCase()] || noop)(value, update);
                }

                // save to session
                this.storeData(update.id, value);
            };

            updates.forEach(runUpdates);
        }
    }

    getFullState(obj) {
        return deepClone(this._sessionData, obj);
    }

    /**
     * 
     * @param {*} stateProp 
     * @param {*} callback 
     * @returns 
     */
    listenForChanges(stateProp, callback) {
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
            deepCheck: !!stateProp.length,
            currentValue
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
    _parseKey(key) {
        return key.startsWith('@') ? key.substring(1) : key;
    }

    /**
     * 
     * @param {*} value 
     * @returns 
     */
    _clone(value) {
        if ([null, undefined].includes(value) || typeof value !== 'object') return value;
        return JSON.parse(JSON.stringify(value));
    }
}