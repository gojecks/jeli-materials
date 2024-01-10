import {DatetimeService} from "@jeli/common/datetime";
import { Inject } from "@jeli/core";

var dateTimeService = Inject(DatetimeService);

export var badElements = "script|link|style|meta|head|body|html".split('|');
/**
 * 
 * @param {*} content 
 * @param {*} value 
 * @returns 
 */
export function replaceArg(content, value){ return (content || '&0').replace('&0', value) };
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
export var MARKDOWN_REGEX =  /@(\w*)+\[(.*?)\]+(\{(.*?)\}|\((.*?)\))+/gi;

/**
 * 
 * @param {*} value 
 * @param {*} lang 
 * @param {*} currency 
 * @returns 
 */
function formatNumber(value, lang, currency){
    var config = {
        maximumSignificantDigits: 3
    };

    if (currency){
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
function parseMath(exprs, data){
    var valueA = deepContext(exprs[0], data);
    var valueB = deepContext(exprs[2], data);
    switch(exprs[1]){
        case('-'):
            return (valueA - valueB);
        case('*'):
            return (valueA * valueB);
        case('+'):
            return (valueA + valueB);
        case('/'):
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
    parse: (attr, body, data) => markupParser(body, data),
    if: (attr, body, data) => {
        var attrs = attr.split('|');
        if (!conditionParser$.parseAndEvaluate(attrs.shift(), data)) return "";
        body = markupParser(body, data);
        return constructHtml(attrs[0] || 'fo-if', attrs[1], body);
    },
    for: (attr, body, data) => {
        var attrs = attr.split('|');
        var forRepeater = deepContext(attrs[0], data);
        if (forRepeater) {
            if (typeof forRepeater == 'string') forRepeater = forRepeater.split(',');
            var content = forRepeater.map(d => replaceArg(markupParser(body, d), d)).join('');
            return constructHtml((attrs[1] || 'fo-for'), attrs[2], content);
        }
        return "";
    },
    currency: (attr, body, data) => {
        var attrs = attr.split('|');
        var value = deepContext(attrs[0], data);
        if (null == value) return "";
        value = formatNumber(value, attrs[1], attrs[2]);
        return constructHtml((attrs[3] || 'fo-currency'), attrs[4], replaceArg(body, value));
    },
    number: (attr, body, data) => {
        var attrs = attr.split('|');
        var value = deepContext(attrs[0], data);
        if (null == value) return "";
        value = formatNumber(value, attrs[1]);
        return constructHtml((attrs[2] || 'fo-number'), attrs[3], replaceArg(body, value));
    },
    time: (attr, body, data) => {
        var attrs = attr.split('|');
        var value = dateTimeService.timeConverter(deepContext(attrs[0], data)).timeago;
        return constructHtml((attrs[1] || 'time-ago'), attrs[2], replaceArg(body, value));
    },
    datetime: (attr, body, data) => {
        var attrs = attr.split('|');
        var value = dateTimeService.format(deepContext(attrs[0], data), attrs[1] || 'MMM DD, YYYY');
        return constructHtml((attrs[2] || 'date-time'), attrs[3], replaceArg(body, value));
    },
    math: (attr, body, data) => {
        var attrs = attr.split('|');
        var value = parseMath(attrs, data);
        if (null == value)  return "";
        if (attrs[5]) {
            value = formatNumber(value, attrs[5], attrs[6]);
        }
        return constructHtml((attrs[3] || 'fo-math'), attrs[4], replaceArg(body, value));
    },
    th: (attr, body, data) => {
        var content = body.split('|').map(v => constructHtml('th', attr, replaceArg(v, data))).join('');
        return constructHtml('thead', '', content);
    },
    td: (attr, body, data) => {
        return body.split('|').map(v => constructHtml('td', attr, replaceArg(v, data))).join('');
    }
};

export function markupParser(content, replacer){
    return content.replace( MARKDOWN_REGEX, function () {
        var tag = arguments[1].toLowerCase();
        var attr = arguments[2] || "";
        var body = arguments[4] || arguments[5];
        // check for bad  tags
        if (badElements.includes(tag)) return "";
        if (!!markupHandlers$[tag])
            return markupHandlers$[tag](attr, htmlValueParser(body, replacer), replacer);

        // single replace
        return constructHtml(tag, htmlValueParser(attr, replacer, '-'), ((!arguments[4]) ? htmlValueParser(body, replacer) : markupParser(body, replacer)));
    });
};

