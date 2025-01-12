import { DatetimeService } from "@jeli/common/datetime";
import { Inject } from "@jeli/core";
import { deepContext } from "./utils";

var dateTimeService = Inject(DatetimeService);
var tagsCheckers = {
    select: [['class', 'form-select']],
    input: [['type', 'text'], ['class', 'form-control']],
    button: [['class', 'btn btn-primary']]
};

export var badElements = "script|link|style|meta|head|body|html".split('|');
/**
 * 
 * @param {*} content 
 * @param {*} value 
 * @returns 
 */
export function replaceArg(content, value, regex) { return (content || '&0').replace(regex || /&0/g, value) };
/**
 * 
 * @param {*} tag 
 * @param {*} attr 
 * @param {*} body 
 * @returns 
 */
export function constructHtml(tag, attr, body) {
    return `<${tag} ${(attr || '')}>${(Array.isArray(body) ? body.join('') : (body || '')).replace(/\n/g, '<br/>')}</${tag}>`;
};

/**
 * MARKDOWN REGULAR EXPRESSION
 */
export var MARKDOWN_REGEX = /@(\w*)+\[(.*?)\]+(\{(.*?)\}|\((.*?)\))+/gi;

/**
 * 
 * @param {*} value 
 * @param {*} lang 
 * @param {*} currency 
 * @returns 
 */
export function formatNumber(value, lang, currency) {
    var config = {
        maximumSignificantDigits: 3
    };

    if (currency) {
        config = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            style: 'currency',
            currency,
        };
    };

    return new Intl.NumberFormat((lang || navigator.language), config).format(value || 0);
}
/**
 * Object to hold interpolators
 */
var interPolators = {
    json: (value) => {
        if (typeof value == 'object')
            return JSON.stringify(value);
        return value || '';
    },
    noop: (value) => value,
    datetime: (value, attrs) => dateTimeService.format(value, attrs[0] || 'MMM DD, YYYY'),
    timeago: (value) => dateTimeService.timeConverter(value).timeAgo
};



/**
 * 
 * @param {*} key 
 * @param {*} replacer 
 * @param {*} defaultValue 
 * @returns 
 */
function interpolationParser(key, replacer, defaultValue) {
    // extract pipe from str
    var interpolation = key.split('|');
    key = interpolation.shift().trim();
    var value = key ? replacer(key) : key;
    if ([null, undefined, ''].includes(value))
        value = (value || defaultValue || '');
    // check value state
    return !interpolation[0] ? value : runFilters(value, interpolation, replacer);
}

/**
 * 
 * @param {*} value 
 * @param {*} interpolations 
 * @param {*} replacer 
 * @returns 
 */
export function runFilters(value, interpolations, replacer) {
    return interpolations.reduce((accum, interpolation) => {
        interpolation = interpolation.trim().split(':');
        accum = interPolators[(interpolation.shift() || 'noop').toLowerCase()](accum, interpolation, replacer);
        return accum;
    }, value);
}

/**
 * 
 * @param {*} str 
 * @param {*} values 
 * @param {*} regex 
 * @returns 
 */
export function parseValue(str, replacer, regex, defaultValue) {
    if (!str) return '';

    regex = regex || /\{\{([\w,\s.$@|:*+-_/]+)\}\}/g;
    var isFnRplr = (typeof replacer == 'function');
    var dataFn = ckey => (isFnRplr ? replacer(ckey, true) : deepContext(ckey, replacer));
    return str.replace(regex, (_, key) => interpolationParser(key, dataFn, defaultValue));
}

/**
 * context fn for var and for markups
 * @param {*} value 
 * @param {*} data 
 * @param {*} idx
 * @returns 
 */
export function getContextFn(value, data, idx) {
    return key => (key == '$index') ? idx : deepContext(key, key.charAt(0) == '@' ? data : value);
}

/**
 * 
 * @param {*} str 
 * @param {*} values 
 * @returns 
 */
export function htmlValueParser(str, replacer, defaultValue) {
    if (!str) return defaultValue;
    return parseValue(str, replacer, /\%([\w,\s.$@|:*+-_/]+)\%/g, defaultValue);
}

/**
 * 
 * @param {*} exprs 
 * @param {*} data 
 * @returns number
 */
export function parseMath(exprs, data) {
    var valueA = deepContext(exprs[0], data);
    var valueB = deepContext(exprs[2], data);
    switch (exprs[1]) {
        case ('-'):
            return (valueA - valueB);
        case ('*'):
            return (valueA * valueB);
        case ('+'):
            return (valueA + valueB);
        case ('/'):
            return (valueA / valueB);
    }

    return null;
}

/**
 * 
 * @param {*} attr 
 * @param {*} node 
 * @param {*} replacerData 
 * @returns 
 */
function mapAttributes(attr, node, replacerData) {
    if (!attr && !tagsCheckers[node]) return '';
    if (tagsCheckers[node])
        attr = tagsCheckers[node].reduce((accum, checkObj) => {
            if (!accum.includes(checkObj[0])) accum += `${checkObj[0]}="${checkObj[1]}"`;
            return accum;
        }, attr || '');

    return htmlValueParser(attr, replacerData, '-')
}

/**
 * 
 * @param {*} content 
 * @param {*} replacer 
 * @returns 
 */

var markupHandlers$ = {
    time: (attrs, body, data) => {
        var value = dateTimeService.timeConverter(deepContext(attrs[0], data)).timeago;
        return constructHtml((attrs[1] || 'fo-time-ago'), attrs[2], replaceArg(body, value));
    },
    datetime: (attrs, body, data) => {
        var origValue = parseInt(attrs[0]);
        var value = deepContext(attrs[0], data);
        value = dateTimeService.format(value || origValue, attrs[1] || 'MMM DD, YYYY');
        return constructHtml((attrs[2] || 'fo-date-time'), attrs[3], replaceArg(body, value));
    }
};

/**
 * 
 * @param {*} astNodes 
 * @param {*} replacerData 
 * @returns 
 */
export function renderBody(astNodes, replacerData) {
    if (!astNodes) return astNodes;
    if (typeof astNodes == 'string') return htmlValueParser(astNodes, replacerData);

    return astNodes.map(node => {
        try {
            // node can be string if the body of an element contains textNode and element
            // e.g @element[]{this is another element @newElement[](New element)}
            if (typeof node == 'string') return htmlValueParser(node, replacerData);

            var tagName = node[0];
            var handler = markupHandlers$[tagName];
            if (!!handler)
                return htmlValueParser(handler(node[1].split('|'), node[2], replacerData), replacerData);

            var body = '';
            var attr = mapAttributes(node[1] && node[1].trim(), tagName, replacerData);

            // node[2] body is defined
            if (node[2])
                body = Array.isArray(node[2]) ? renderBody(node[2], replacerData) : htmlValueParser(node[2], replacerData);

            // attach template and observer slot
            if (tagName == 'dyn-observe') {
                body = [
                    constructHtml('dyn-observer-slot', '', body),
                    constructHtml('template', null, JSON.stringify(node[2]))
                ];
            }

            return constructHtml(tagName, attr, body);
        } catch (e) {
            return ''
        }
    }).join('');
}


export var markupRegistry = {
    /**
     * 
     * @param {*} markupName 
     * @param {*} handler 
     */
    tag: (markupName, handler) => {
        if (markupHandlers$.hasOwnProperty(markupName))
            throw new Error(`${markupName} already exists please change tag name`);
        if (typeof handler !== 'function')
            throw new Error(`${markupName} handler must be a function`);
        markupHandlers$[markupName] = handler;

        return markupRegistry;
    },
    /**
     * 
     * @param {*} filterName 
     * @param {*} handler 
     */
    filter: (filterName, handler) => {
        if (interPolators.hasOwnProperty(filterName))
            throw new Error(`${filterName} already exists please change tag name`);
        if (typeof handler !== 'function')
            throw new Error(`${filterName} handler must be a function`);
        interPolators[filterName] = handler;

        return markupRegistry;
    },
    _keys: () => Object.keys(markupHandlers$)
};


/**
 * 
 * @param {*} markupLanguage 
 * @param {*} replacerData 
 * @returns 
 */
export function renderMarkupElements(markupLanguage, replacerData) {
    return renderBody(parseMarkupLanguage(markupLanguage), replacerData);
};

/**
 * 
 * @param {*} markupLanguage
 * @returns 
 */
function parseMarkupLanguage(markupLanguage) {
    var tokens = markupLanguage.split(/(@[\w-]+\[.*?\])/g);
    var currentElem = null;
    var manyNested = [];
    var astNodes = [];
    for (var i = 0; i < tokens.length; i++) {
        var item = tokens[i].trim();
        if (!item || '({'.includes(item)) continue;
        var currentNested = manyNested[manyNested.length - 1];
        if (item.startsWith('@')) {
            var match = item.match(/@([\w-]*)+\[(.*?)\]/);
            // check for badElement and skip if found
            if (!match || badElements.includes(match[1])) continue;
            currentElem = [match[1].toLowerCase(), match[2]];
            // push to astNodes
            if (!manyNested.length) {
                astNodes.push(currentElem);
            }
            // push element to children if manyNested have a element
            if (currentNested && Array.isArray(currentNested[2]))
                currentNested[2].push(currentElem);

            if (tokens[i + 1] && tokens[i + 1].trim().startsWith('{')) {
                // set the container for children elements
                currentElem.push([]);
                manyNested.push(currentElem)
            }
        } else {
            var isFnBrace = item.match(/\((.*?)\)$/);
            if (isFnBrace) {
                currentElem[2] = isFnBrace[1];
            } else {
                var textContent = '';
                /**
                * check for possible nodes match
                * closing from a nested element or a text that contains (closing function)
                * eg `(this is an element) it works`
                */
                for (var x = 0; x < item.length; x++) {
                    var node = item[x];
                    if (node == '{') continue;
                    if (node == '(') {
                        if (textContent && currentNested) {
                            currentNested.push(textContent);
                            textContent = '';
                        }

                        var closingTagIndex = item.lastIndexOf(')');
                        if (1 <= closingTagIndex) {
                            textContent += item.substr(x + 1, closingTagIndex - 1);
                            x = closingTagIndex;
                            // some element can define a empty ()
                            // if textContent is empty we don't set it
                            if (textContent) currentElem[2] = textContent;

                            textContent = '';
                            // set currentElem to be the parent since the child element is closed
                            currentElem = currentNested;
                            continue;
                        }
                    } else if (node == '}') {
                        // closing tag found and textContent
                        // push to parentElement
                        if (textContent) {
                            currentNested.push(textContent);
                            textContent = '';
                        }

                        if (manyNested.length)
                            manyNested.pop();
                        continue;
                    } else {
                        textContent += node
                    }
                }

                // attach text content to child if any found
                if (textContent && Array.isArray(currentElem[2]))
                    currentElem[2].push(textContent);
            }

        }
    }

    return astNodes;
}
