import { debounce } from "@jeli/core";
import { MARKDOWN_REGEX, renderMarkupElements } from "./markup.parser";
// counter used internally for elements
export var internal_counter = 0;
export function base64ToFile(b64File, type) {
    if (typeof b64File != 'string') return b64File;

    var split = b64File.split(',');
    type = type || split[0].replace('data:', '').replace(';base64', '');
    var byteString = atob(split[1]);
    return createBlobObject(byteString, type);
}

/**
 * 
 * @param {*} byteString 
 * @param {*} type 
 * @param {*} withUrl 
 */
export function createBlobObject(byteString, type, withUrl) {
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i);
    }

    var blobObject = new Blob([ab], { type });
    // create a object URl for serving our blob content
    if (withUrl) blobObject = URL.createObjectURL(blobObject);

    return blobObject;
};


/**
 * 
 * @param {*} b64File 
 * @param {*} type 
 * @returns url or File<string>
 */
export function blobURL(b64File, type) {
    try {
        return URL.createObjectURL(base64ToFile(b64File, type));
    } catch (e) {
        return b64File;
    }
}

/**
 * 
 * @param {*} file 
 * @param {*} regEx 
 * @param {*} asObject 
 * @returns 
 */
export function readFile(file, regEx, asObject) {
    return new Promise(function (resolve, reject) {
        var fileReader = new FileReader();
        try {
            if (file && regEx.test(file.type)) {
                fileReader.readAsDataURL(file);
            } else {
                reject(null);
            }
        } catch (e) {
            reject(null);
        }

        fileReader.onload = function (content) {
            if (asObject) {
                resolve({
                    name: file.name,
                    content: content.target.result,
                    blobURL: blobURL(content.target.result)
                });
            } else {
                resolve(content.target.result);
            }
        };
    });
}

/**
 * 
 * @param {*} fileList 
 * @param {*} regEx 
 * @param {*} asObject 
 * @returns 
 */
export function readFileMultiple(fileList, regEx, asObject) {
    return Promise.all(fileList.map(function (file) { return readFile(file, regEx, asObject) }));
}


/**
 * 
 * @param {*} key 
 * @param {*} context 
 * @returns 
 */
export function deepContext(key, context) {
    if (typeof key !== 'string' || !context) null;
    if (typeof context == 'function') return context(key, true);

    key = key.split('.');
    if (!key[0]) key.unshift(key.splice(0, 2).join('.'));
    if (key[0].startsWith('@')) key[0] = key[0].substring(1);

    return key.reduce((accum, key) => {
        if (key == '$0') return accum;
        if (key && accum) { accum = ((typeof accum == 'function') ? accum(key) : accum[key]); } 
        return accum;
    }, context);
}

/**
 * 
 * @param {*} conditions 
 * @param {*} context 
 * @returns boolean
 */
export function checkConditions(conditions, context) {
    var isOptionalDeepContext = typeof context === 'function';
    var checkCondition = function (condition) {
        var conditionKeys = Object.keys(condition);
        for (var key of conditionKeys) {
            var operator = null;
            var conditionValue = condition[key];
            var value = (/^[0-9]/.test(key) ? parseInt(key) : isOptionalDeepContext ? context(key, true) : deepContext(key, context));
            if (typeof conditionValue === 'object') {
                operator = (conditionValue.operator || conditionValue.type);
                conditionValue = conditionValue.value;
            } else {
                operator = Array.isArray(conditionValue) ? 'rin' : Array.isArray(value) ? 'in' : 'eq';
                if (typeof value !== 'boolean' && typeof conditionValue === 'boolean') {
                    value = !!value;
                    operator = 'truthy';
                }
            }


            if (!conditionParser$.evaluate(operator, value, conditionValue)) {
                return false;
            }
        }

        return true;
    };

    if (!Array.isArray(conditions) || !conditions.length) {
        return true;
    }

    return conditions.some(checkCondition);
}

/**
 * 
 * @param {*} cssRules 
 * @param {*} fragment 
 */
export function createStyleSheet(cssRules, fragment) {
    var styleSheet = document.createElement('style');
    styleSheet.setAttribute('type', 'text/css');
    styleSheet.appendChild(document.createTextNode(cssRules));
    fragment = fragment || document.getElementsByTagName('head')[0];
    fragment.appendChild(styleSheet);
    styleSheet = null;
}



/**
 * return html strings
 * @param {*} text 
 * @param {*} data
 * @param {*} ignoreFalseMatch
 * @returns null|HtmlString
 */
export function parseText(text, data, ignoreFalseMatch) {
    if (!(text || '').match(MARKDOWN_REGEX)) return ignoreFalseMatch ? text : null;
    return renderMarkupElements(text, data);
}

/**
 * 
 * @param {*} name 
 * @param {*} comp 
 * @param {*} value 
 * @param {*} auto 
 * @param {*} isJson 
 */
export function setCompValue(name, comp, value, auto, isJson) {
    if (name.lastIndexOf('.')) {
        var keys = name.split('.');
        if (name.startsWith('.')) {
            keys.shift();
            keys[0] = '.' + keys[0];
        }
        name = keys.pop();
        comp = keys.reduce((accum, key, idx) => {
            if (!accum.hasOwnProperty(key) || !accum[key] || typeof accum[key] !== 'object') {
                var next = keys[idx + 1] || name;
                accum[key] = /[0-9]/.test(next) ? [] : {};
            }
            return accum = accum[key], accum;
        }, comp);
    }

    comp[name] = auto ? !comp[name] : isJson ? parseJson(value, isJson, true) : testOrParseJson(value);
}

/**
 * 
 * @param {*} context 
 * @param {*} debounceTime 
 * @returns 
 */
export var debouncer = function (context, debounceTime) {
    return debounce(function (ele, isBoolean, comp) {
        var elementName = ele.name;
        if (elementName && typeof (comp || context) !== 'string') {
            setCompValue(elementName, comp || context, ele.value, isBoolean, ele.getAttribute('vtype'));
        }
    }, debounceTime || 200);
}

export class conditionParser$ {
    static toObject(conditions, lbs) {
        return conditions.split(/\sOR\s/gi).map(str => str.split(/\sAND\s/gi).reduce((accum, key) => {
            var ks = key.split(/[\s:]/).filter(k => k);
            if (ks.length) {
                var ret = {
                    type: (ks[1] || '').toLowerCase(),
                    value: testOrParseJson(ks[2] || '')
                };

                if (ks[3]) {
                    ret.conditions = conditionParser$.simpleCondition(ks[3]);
                }
                accum[ks[0]] = ret;
            }
            return accum;
        }, {}));
    }

    static toString(conditions, simple) {
        if (Array.isArray(conditions)) {
            return conditions.map(condition => Object.keys(condition).map(key => {
                var v = condition[key];
                var isObjValue = typeof v === 'object';
                var ret = [key, (isObjValue ? (v.type || v.operator || 'eq') : 'eq').toUpperCase(), isObjValue ? (v.value !== undefined ? v.value : key) : v].join(simple ? '-' : ' ');
                if (v.conditions) ret += ':' + (conditionParser$.toString(v.conditions, true));
                return ret;
            }).join(simple ? '&' : ' AND ')).join(simple ? '|' : ' OR ');
        }

        return conditions;
    }

    static evaluate(operator, value, check) {
        var operators = ({
            falsy: () => !value === check,
            truthy: () => !!value === check,
            in: () => (value || '').includes(check),
            notin: () => !operators.in(),
            nnotin: () => !!operators.in(),
            rin: () => (check || '').includes(value),
            rnotin: () => !operators.rin(),
            rnnotin: () => !!operators.rin(),
            any: () => Array.isArray(value) && check && value.some(v => check.includes(v)),
            notany: () => {
                if (typeof value == 'string') value = value.split(',');
                return !operators.any();
            },
            rany: () => Array.isArray(check) && value && check.some(v => value.includes(v)),
            rnotany: () => {
                if (typeof check == 'string') check = check.split(',');
                return !operators.rany();
            },
            gt: () => value > check,
            gte: () => value >= check,
            lt: () => value < check,
            lte: () => value <= check,
            is: () => value === check,
            eq: () => value == check,
            noteq: () => value !== check,
            not: () => value != check,
            isdefined: () => ((undefined != value) == check)
        });

        return (operators[operator.toLowerCase()] || function () { return false; })();
    }

    static simpleCondition(condition) {
        return condition.split('|').map(entry => entry.split('&').reduce((accum, cEntry) => {
            var v = cEntry.split('-')
            accum[v[0]] = {
                type: (v[1] || 'EQ').toLowerCase(),
                value: testOrParseJson(v[2])
            };

            return accum;
        }, {}));
    }

    static idsToObject(value) {
        var spId = value.split(':');
        if (spId[0]) {
            var ret = { id: spId.shift().trim() };
            if (spId.length) {
                ret.conditions = conditionParser$.simpleCondition(spId.pop());
            }

            return ret;
        }

        return conditionParser$.simpleCondition(spId.pop());
    }
    static idsToString(value, isIds) {
        if (isIds)
            return (typeof value === 'object' ? (value.id + (value.conditions ? ':' + conditionParser$.toString(value.conditions, true) : '')) : value);

        return ':' + conditionParser$.toString(value, true);
    }
    static parseAndEvaluate(condition, context) {
        if (!condition) return true;
        var cachedConditions = conditionParser$.$cachedConditions.get(condition);
        if (!cachedConditions) {
            cachedConditions = conditionParser$.toObject(condition);
            conditionParser$.$cachedConditions.set(condition, cachedConditions);
        }
        return checkConditions(cachedConditions, context);
    }

    static evaluateConditionalValue(condition, context) {
        if (!condition) return '';
        var cachedConditions = conditionParser$.$cachedConditions.get(condition);
        if (!cachedConditions) {
            cachedConditions = condition.split(':').map(a => a.trim().split('='));
            conditionParser$.$cachedConditions.set(condition, cachedConditions);
        }

        var getValue = propValue => propValue.startsWith('@') ? deepContext(propValue, context) : testOrParseJson(propValue);

        // parse the value
        for (var cond of cachedConditions) {
            if (!cond[1]) {
                var value = getValue(cond[0]);
                if (![undefined, null].includes(value)) return value;
            } else if (conditionParser$.parseAndEvaluate(cond[1], context)) {
                return getValue(cond[0]);
            }
        }

        return '';
    }

    static $cachedConditions = new Map()
};

function testOrParseJson(value) {
    if (!value || (typeof value !== 'string')) return value;
    try {
        return ('[{'.includes(value.trim().charAt(0)) || /(true|false|null)/.test(value)) ? JSON.parse(value) : /(^[\d]*$)/.test(value) ? +(value) : value;
    } catch (e) {
        return value;
    }
}

/**
 * 
 * @param {*} value 
 * @param {*} type 
 * @param {*} rOnError 
 * @returns 
 */
function parseJson(value, type, rOnError) {
    if (!type) return testOrParseJson(value);
    try {
        if (['json-e', 'json-eol', 'json-epdol', 'json-epd', 'json-a'].includes(type))
            return htmlAttrToJson(value, type.includes('ol'), type.includes('-epd'));
        else if (type == 'json-c')
            return conditionParser$.toObject(value);
        else if (type == 'json-id')
            return conditionParser$.idsToObject(value);
        else if (type == 'json-akvpnl')
            return arrayKeyValuePairAttrToJson(value);
        else if (type == 'json')
            return JSON.parse(value);
        else if (type == 'json-arr')
            return value.split(',');
    } catch (err) {
        return rOnError ? value : null;
    }
}

function arrayKeyValuePairAttrToJson(value) {
    return value.split('\n').map(expr => htmlAttrToJson(expr));
}

/**
 * 
 * @param {*} value 
 * @returns Object
 */
export function htmlAttrToJson(value, lbs, deep) {
    if (typeof value != 'string') return value;
    if (lbs) value = value.split('\n');
    else value = value.match(/(\S+)=\s*?((?:.(?!["']?\s+(?:\S+)=|["']))+.)?./g);
    return (value || []).reduce((accum, key) => {
        if (key) {
            const eqIndx = key.indexOf('=');
            const kValue = key.substr(eqIndx + 1).trim().replace(/["']/g, '');
            const kProp = key.substr(0, eqIndx);
            const pType = (/:\w/.test(kValue) && !kValue.includes('//'))  ? 'json-id' : null;
            if (!deep) {
                accum[kProp] = parseJson(kValue, pType, true);
            } else {
                setCompValue(kProp, accum, kValue, false, pType);
            }
        }
        return accum;
    }, {})
}

export function deepClone(obj, additionalObj) {
    return Object.assign(JSON.parse(JSON.stringify(obj)), (additionalObj || {}));
}

export var cryptoUtils = {
    generate: (content, algo) => {
        const utf8 = new TextEncoder().encode(content);
        return crypto.subtle.digest(algo || 'SHA-256', utf8).then((hashBuffer) => {
            return Array.from(new Uint8Array(hashBuffer)).map((bytes) => bytes.toString(16).padStart(2, '0'))
                .join('');
        });
    },
    generateMultiple: (values, algo) => {
        return Promise.all(values.map(val => cryptoUtils.generate(val, algo)))
    },
    verify: (value, hash, algo) => {
        cryptoUtils.generate(value, algo).then(nHash => {
            // compare newHash vs user supplied
            resolve(nHash === hash);
        });
    }
};

export function px2vh(value) {
    return Math.round((100 * value) / document.documentElement.clientHeight);
}

export function px2vw(value) {
    return Math.round((100 * value) / document.documentElement.clientWidth);
}

export function vw2px(d) {
    return Math.round((document.documentElement.clientWidth * d) / 100);
}

export function vh2px(d) {
    return Math.round((document.documentElement.clientHeight * d) / 100);
}

export function convert2Number(value, dim) {
    if (typeof value == 'string') {
        var match = value.match(/[vh%]/g);
        if (match) {
            value = (dim == 'h' ? vh2px : vw2px)(parseInt(value));
        } else {
            value = parseInt(value);
        }
    }

    return value;
}