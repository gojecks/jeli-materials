import { DatetimeService } from "@jeli/common/datetime";
import { Inject } from "@jeli/core";

var dateTimeService = Inject(DatetimeService);

export var badElements = "script|link|style|meta|head|body|html".split('|');
/**
 * 
 * @param {*} content 
 * @param {*} value 
 * @returns 
 */
export function replaceArg(content, value) { return (content || '&0').replace('&0', value) };
/**
 * 
 * @param {*} tag 
 * @param {*} attr 
 * @param {*} body 
 * @returns 
 */
export function constructHtml(tag, attr, body) {
    return '<' + tag + ' ' + (attr || '') + '>' + body.replace(/\n/g, '<br/>') + '</' + tag + '>';
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
function formatNumber(value, lang, currency) {
    var config = {
        maximumSignificantDigits: 3
    };

    if (currency) {
        config.style = 'currency',
            config.currency = currency;
    }

    return new Intl.NumberFormat((lang || navigator.language), config).format(value || 0);
}

/**
 * 
 * @param {*} exprs 
 * @param {*} data 
 * @returns number
 */
function parseMath(exprs, data) {
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
 * @param {*} content 
 * @param {*} replacer 
 * @returns 
 */
var markupHandlers$ = {
    if: (attrs, body, data) => {
        if (!conditionParser$.parseAndEvaluate(attrs.shift(), data)) return "";
        return constructHtml(attrs[0] || 'fo-if', attrs[1], renderBody(body, data));
    },
    for: (attrs, body, data) => {
        var forRepeater = deepContext(attrs[0], data);
        var content = "";
        if (Array.isArray(forRepeater)) {
            if (typeof forRepeater == 'string') forRepeater = forRepeater.split(',');
            content = forRepeater.map(d => replaceArg(renderBody([[(attrs[1] || 'fo-for'), attrs[2], body]], d), d)).join('');
        }
        return content;
    },
    currency: (attrs, body, data) => {
        var value = deepContext(attrs[0], data);
        if (null == value) return "";
        value = formatNumber(value, attrs[1], attrs[2]);
        return constructHtml((attrs[3] || 'fo-currency'), attrs[4], replaceArg(body, value));
    },
    number: (attrs, body, data) => {
        var value = deepContext(attrs[0], data);
        if (null == value) return "";
        value = formatNumber(value, attrs[1]);
        return constructHtml((attrs[2] || 'fo-number'), attrs[3], replaceArg(body, value));
    },
    time: (attrs, body, data) => {
        var value = dateTimeService.timeConverter(deepContext(attrs[0], data)).timeago;
        return constructHtml((attrs[1] || 'fo-time-ago'), attrs[2], replaceArg(body, value));
    },
    datetime: (attr, body, data) => {
        var attrs = attr.split('|');
        var value = dateTimeService.format(deepContext(attrs[0], data), attrs[1] || 'MMM DD, YYYY');
        return constructHtml((attrs[2] || 'fo-date-time'), attrs[3], replaceArg(body, value));
    },
    math: (attrs, body, data) => {
        var value = parseMath(attrs, data);
        if (null == value) return "";
        if (attrs[5]) {
            value = formatNumber(value, attrs[5], attrs[6]);
        }
        return constructHtml((attrs[3] || 'fo-math'), attrs[4], replaceArg( body, value));
    },
    th: (attrs, body, data) => {
        var content = body.split('|').map(v => constructHtml('th', attrs.join(''), replaceArg(v, data))).join('');
        return constructHtml('thead', '', content);
    },
    td: (attrs, body, data) => {
        return body.split('|').map(v => constructHtml('td', attrs.join(''), replaceArg(v, data))).join('');
    }
};



/**
 * 
 * @param {*} astNodes 
 * @param {*} replacerData 
 * @returns 
 */
function renderBody(astNodes, replacerData) {
    return astNodes.map(node => {
        // node can be string if the body of an element contains textNode and element
        // e.g @element[]{this is another element @newElement[](New element)}
        if (typeof node == 'string') return htmlValueParser(node, replacerData);

        if (!!markupHandlers$[node[0]])
            return htmlValueParser(markupHandlers$[node[0]](node[1].split('|'), node[2], replacerData), replacerData);

        var isArrayBody = (Array.isArray(node[2]) && (Array.isArray(node[2][0]) || node[2].length > 1));
        var body = '';
        // node[2] body is defined
        if (node[2]){
            body = isArrayBody ? renderBody(node[2], replacerData) : htmlValueParser(node[2], replacerData);
        }

        // single replace
        return constructHtml(node[0], htmlValueParser(node[1], replacerData, '-'), body);
    }).join('')
}

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
    var tokens = markupLanguage.split(/(@[\w]+\[.*?\])/g);
    var currentElem = null;
    var manyNested = [];
    var astNodes = [];
    for (var i = 0; i < tokens.length; i++) {
        var item = tokens[i].trim();
        if (!item || '({'.includes(item)) continue;
        var currentNested = manyNested[manyNested.length - 1];
        if (item.startsWith('@')) {
            var match = item.match(/@(\w*)+\[(.*?)\]/);
            // check for badElement and skip if found
            if (badElements.includes(match[1])) continue;
            currentElem = [match[1].toLowerCase(), match[2]];
            // push to astNodes
            if (!manyNested.length) {
                astNodes.push(currentElem);
            }
            // push element to children if manyNested have a element
            if (currentNested && Array.isArray(currentNested[2])) {
                currentNested[2].push(currentElem)
            }
            if (tokens[i + 1].trim().startsWith('{')) {
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
                            if (textContent)
                                currentElem[2] = textContent;

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
                if (textContent) {
                    currentElem[2].push(textContent);
                }
            }

        }
    }

    return astNodes;
}
