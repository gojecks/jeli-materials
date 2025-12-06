import { conditionParser$, deepClone, deepContext, setCompValue } from "../utils";
import { AUTH_STORAGE_PROVIDER } from "./tokens";

/**
 * list of accepted storage types
 */
const STORAGE_TYPES = [
    'sessionStorage', 
    'localStorage'
];

const fromStorage = type => key => testOrParseJson(window[STORAGE_TYPES[type]].getItem(key))

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
        this.storageProvider = storageProvider;
        this.ignoreKeysOnReload = [];
        this._sessionData = Object.defineProperties({}, {
            ISODate: {
                get: () => new Date().toISOString().split('.')[0]
            },
            now: {
                get: () => Date.now()
            },
            location: {
                get: () => location
            },
            localStorage: {
                get:() => fromStorage(1)
            },
            sessionStorage: {
                get: () =>  fromStorage(0)
            }
        });

        this._storageType = (STORAGE_TYPES[storageProvider.storageType || 0])
        this._observers = {};
        this._stack = {
            'auth-reload': () => {
                // remove keys from state before saving
                this.ignoreKeysOnReload.forEach(key => delete this._sessionData[key]);
                return this._sessionData;
            }
        };

        // get the storageData
        if (storageProvider.storage) {
            this._retrieveSessionFromStorage();
        }

        /**
         * register eventListener
         */
        if (document) {
            let isBeforeUnload = false;
            window.addEventListener('beforeunload', () => {
                isBeforeUnload = true;
                this.saveSessionStack();
            }, false);

            // this is workaround for browser that don't trigger beforeunload
            if (document.visibilityState && storageProvider.useVisibilityChange){
                document.addEventListener('visibilitychange', e => {
                    if (!isBeforeUnload){
                        this.saveSessionStack();
                    }                    
                }, false);
            } 
        }

        console.log('[StateManager] Initialized..');
    }

    has(key){
        return this._sessionData.hasOwnProperty(key);
    }

    isDefined(key){
        return !!this.getData(key);
    }

    saveSessionStack() {
        if (this.storageProvider.storage && this._storageType in window) {
            for (var stack in this._stack) {
                var value = this._stack[stack]();
                //store the ref data to be retrieve
                if (value && Object.keys(value).length) {
                    window[this._storageType].setItem(stack, JSON.stringify(value));
                }
            }
        }
    }

    addToStack(name, fn) {
        if (this._stack && !this._stack.hasOwnProperty(name) && typeof fn === 'function') {
            this._stack[name] = fn;
        }
    }

    removeFromStack(stackName) {
        if (this._stack.hasOwnProperty(stackName)) {
            delete this._stack[stackName];
        }
    }

    destroy(stateIds) {
        this._retrieveSessionFromStorage();
        if (Array.isArray(stateIds)){
            stateIds.forEach(id => { delete this._sessionData[id]});
        } else {
            this._sessionData = {};
        }
    }

    getData(key) {
        if (!key) return undefined;
        return deepContext(this._parseKey(key), this._sessionData);
    }

    storeData(key, value, preserve, saveNow) {
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

        // check for autoSave
        if (this.storageProvider.autoSave || saveNow){
            this.saveSessionStack();
        }
    }

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

    _retrieveSessionFromStorage(){
        var sessionData = JSON.parse(window[this._storageType].getItem('auth-reload') || '{}');
        Object.assign(this._sessionData, sessionData);
        sessionData = null;
        //remove the cache data
        window[this._storageType].removeItem('auth-reload');
    }
}