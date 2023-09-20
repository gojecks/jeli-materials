import { debounce, Inject } from "@jeli/core";
import {DatetimeService} from "@jeli/common/datetime";

var dateTimeService = Inject(DatetimeService);

export function base64ToFile(base64Image) {
    var split = base64Image.split(',');
    var type = split[0].replace('data:', '').replace(';base64', '');
    var byteString = atob(split[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: type });
}

export function blobURL(base64Image) {
    return URL.createObjectURL(base64ToFile(base64Image));
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



export var badElements = "script|link|style|meta|head|body|html".split('|');
/**
 * 
 * @param {*} str 
 * @param {*} values 
 * @param {*} regex 
 * @returns 
 */
export function parseValue(str, replacer, regex, defaultValue) {
    regex = regex || /\{\{(.*?)\}\}/g;
    var isFnRplr = (typeof replacer === 'function');
    return str.replace(regex, (_, key) => {
        var value = isFnRplr ? replacer(key) : deepContext(key, replacer);
        return value || defaultValue || '';
    });
}

/**
 * 
 * @param {*} str 
 * @param {*} values 
 * @returns 
 */
export function htmlValueParser(str, replacer, defaultValue) {
    if (typeof replacer === 'function') {
        return replacer(str);
    }
    return parseValue(str, replacer, /\%(.*?)\%/g, defaultValue);
}

/**
 * 
 * @param {*} key 
 * @param {*} context 
 * @returns 
 */
export function deepContext(key, context) {
    if (typeof key !== 'string') null;
    if (typeof context == 'function') return context(key, null, true);

    key = key.split('.');
    if (!key[0])
        key.unshift(key.splice(0, 2).join('.'));
    return key.reduce((accum, key) => {
        if (key && accum) { accum = accum[key] } return accum
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
            var isStateKey = key.startsWith('@');
            key = isStateKey ? key.substring(1) : key;
            var value = isOptionalDeepContext ? context(key, isStateKey, true) : deepContext(key, context);
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
    var regex = /@(\w*)+\[(.*?)\]+(\{(.*?)\}|\((.*?)\))+/gi;
    if (!(text || '').match(regex)) return ignoreFalseMatch ? text : null;
    /**
     * 
     * @param {*} content 
     * @param {*} replacer 
     * @returns 
     */
    var handlers = {
        parse: (attr, body, data) => parser(body, data),
        if: (attr, body, data) => {
            var attrs = attr.split('|');
            if (!conditionParser$.parseAndEvaluate(attrs.shift(), data)) return "";
            body = parser(body, data);
            return constructHtml(attrs[0] || 'fo-if', attrs[1], body);
        },
        for: (attr, body, data) => {
            var forRepeater = deepContext(attr, data);
            if (forRepeater) {
                return forRepeater.map(d => parser(body, d)).join('')
            }
            return "";
        },
        currency: (attr, body, data) => {
            var attrs = attr.split('|');
            var config = {
                style: 'currency',
                currency: attrs[2],
                maximumSignificantDigits: 3
            };

            var value = new Intl.NumberFormat((attrs[1] || navigator.language), config).format(deepContext(attrs[0], data) || 0);
            return constructHtml((attrs[3] || 'fo-currency'), attrs[4], (body || '&0').replace('&0', value));
        },
        number: (attr, body, data) => {
            var attrs = attr.split('|');
            var value = new Intl.NumberFormat((attrs[1] || navigator.language)).format(deepContext(attrs[0], data) || 0);
            return constructHtml((attrs[2] || 'fo-number'), attrs[3], (body || '&0').replace('&0', value));
        },
        time: (attr, body, data) => {
            var attrs = attr.split('|');
            var value = dateTimeService.timeConverter(deepContext(attrs[0], data)).timeago;
            return constructHtml((attrs[1] || 'time-ago'), attrs[2], (body || '&0').replace('&0', value));
        }
    };

    var constructHtml = function(tag, attr, body) {
        return '<'+ tag + ' ' + (attr || '') + '>' + body + '</' + tag + '>';
    };


    var parser = (content, replacer) => {
        return content.replace(regex, function () {
            var tag = arguments[1].toLowerCase();
            var attr = arguments[2] || "";
            var body = arguments[4] || arguments[5];
            // check for bad  tags
            if (badElements.includes(tag)) return "";
            if (handlers.hasOwnProperty(tag))
                return handlers[tag](attr, htmlValueParser(body, replacer), replacer);

            // single replace
            return constructHtml(tag, htmlValueParser(attr, replacer, '-'), ((!arguments[4]) ? htmlValueParser(body, replacer) : parser(body, replacer)));
        });
    };

    return text.split(/\n/g).map(c => parser(c, data)).join('');
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

export var conditionParser$ = {
    toObject: (conditions, lbs) => {
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
    },
    toString: (conditions, simple) => {
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
    },
    evaluate: (operator, value, check) => {
        return (({
            falsy: () => !value === check,
            truthy: () => !!value === check,
            in: () => value.include(check),
            notin: () => !value.includes(check),
            rin: () => check.includes(value),
            rnotin: () => !check.includes(value),
            any: () => Array.isArray(value) && value.some(v => check.includes(v)),
            gt: () => value > check,
            gte: () => value >= check,
            lt: () => value < check,
            lte: () => value <= check,
            is: () => value === check,
            eq: () => value == check,
            noteq: () => value !== check,
            not: () => value != check
        })[operator.toLowerCase()] || function () { return false; })();
    },
    simpleCondition: condition => {
        return condition.split('|').map(entry => entry.split('&').reduce((accum, cEntry) => {
            var v = cEntry.split('-')
            accum[v[0]] = {
                type: (v[1] || 'EQ').toLowerCase(),
                value: testOrParseJson(v[2])
            };

            return accum;
        }, {}));
    },
    idsToObject: value => {
        var spId = value.split(':');
        if (spId[0]) {
            var ret = { id: spId.shift().trim() };
            if (spId.length) {
                ret.conditions = conditionParser$.simpleCondition(spId.pop());
            }

            return ret;
        }

        return conditionParser$.simpleCondition(spId.pop());
    },
    idsToString: (value, isIds) => {
        if (isIds) {
            return (typeof value === 'object' ? (value.id + (value.conditions ? ':' + conditionParser$.toString(value.conditions, true) : '')) : value)
        }
        return ':' + conditionParser$.toString(value, true);
    },
    parseAndEvaluate: (condition, context) => {
        var cachedConditions = conditionParser$.$cachedConditions.get(condition);
        if (!cachedConditions) {
            cachedConditions = conditionParser$.toObject(condition);
            conditionParser$.$cachedConditions.set(condition, cachedConditions);
        }
        return checkConditions(cachedConditions, context);
    },
    $cachedConditions: new Map()

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
    if (lbs) value = value.split('\n');
    else value = value.match(/(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g);
    return (value || []).reduce((accum, key) => {
        var spt = key.split('=');
        var kValue = spt[1].trim().replace(/["']/g, '');
        var kProp = spt[0].trim();
        var pType = (kValue.includes(':')) ? 'json-id' : null;
        if (!deep) {
            accum[kProp] = parseJson(kValue, pType, true);
        } else {
            setCompValue(kProp, accum, kValue, false, pType);
        }

        return accum;
    }, {})
}

export function deepClone(obj, additionalObj) {
    return Object.assign(JSON.parse(JSON.stringify(obj)), (additionalObj || {}));
}