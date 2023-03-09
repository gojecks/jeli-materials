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
    return new Promise(function(resolve, reject) {
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

        fileReader.onload = function(content) {
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
    return Promise.all(fileList.map(function(file) { return readFile(file, regEx, asObject) }));
}



export var badElements = "script|link|style|meta|head|body|html".split('|');
/**
 * 
 * @param {*} str 
 * @param {*} values 
 * @param {*} regex 
 * @returns 
 */
export function parseValue(str, values, regex) {
    regex = regex || /\{\{(.*?)\}\}/g;
    return str.replace(regex, (_, key) => {
        var value = deepContext(key, values);
        return value || '';
    });
}

/**
 * 
 * @param {*} str 
 * @param {*} values 
 * @returns 
 */
export function htmlValueParser(str, replacer) {
    if (typeof replacer  === 'function') {
        return  replacer(str);
    }
    return parseValue(str, replacer, /\%(.*?)\%/g);
}

/**
 * 
 * @param {*} key 
 * @param {*} context 
 * @returns 
 */
export function deepContext(key, context) {
    key = key.split('.');
    if (!key[0])
        key.unshift(key.splice(0,2).join('.'));
    return key.reduce((accum, key) => { 
        if (key && accum) { accum = accum[key] } return accum 
    }, context);
}

/**
 * 
 * @param {*} conditions 
 * @param {*} params 
 * @param {*} userInfo 
 * @returns boolean
 */
export function checkConditions(conditions, params, userInfo) {
    var parseOperator = (operator, value, check) => {
        return (({
            falsy: () => !value,
            truthy: () => !!value,
            in: () => value.include(check),
            notIn: () => !value.includes(check),
            rIn: () => check.includes(value),
            rnotIn: () => !check.includes(value),
            gt:  () => value > check,
            gte: () => value >= check,
            lt: () => value  < check,
            lte: () => value <= check,
            is: () => value === check,
            eq: () => value == check,
            notEq: () => value !== check,
            not: () => value != check
        })[operator] || function(){ return false; })();
    };

    var checkCondition = function(condition) {
        var conditionKeys = Object.keys(condition);
        for (var key of conditionKeys) {
            var stateCheck = false;
            var operator = null;
            var conditionValue = condition[key];
            if (key.startsWith('@user.')) {
                key = key.split('@user.')[1];
                stateCheck = true;
            }
            var value = deepContext(key, stateCheck ? userInfo : params);
            var isArrayChecker = Array.isArray(conditionValue);
            if (conditionValue && typeof conditionValue === 'object' && !isArrayChecker) {
                operator = conditionValue.operator;
                conditionValue = conditionValue.value;
            }

            value = (!isArrayChecker && 'boolean' == typeof conditionValue  && typeof value !== 'boolean') ? !!value : value;
            if (!operator)
                operator = Array.isArray(value) ? 'in' : isArrayChecker ? 'rIn' : 'eq'; 
    
            if (!parseOperator(operator, value, conditionValue)){
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
export function createStyleSheet(cssRules, fragment){
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
    if (!text.match(regex)) return ignoreFalseMatch ? text : null;
    var parser = (content)  => {
        return content.replace(regex, function(){
            var args = arguments;
            // check for bad  tags
            if(badElements.includes(args[1])) return "";
            if (args[1].toLowerCase() === 'parse') return parser(args[4] || args[5]);
            
            // single replace
            return '<'+args[1]+ " " + (args[2]||"") + '>' + ((!args[4])? htmlValueParser(args[5], data) : parser(args[4])) + '</'+args[1]+'>';
        });
    };

    return text.split(/\n/g).map(parser).join('');
}