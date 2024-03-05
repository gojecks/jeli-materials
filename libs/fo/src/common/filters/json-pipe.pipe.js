import { conditionParser$ } from "../../utils";

Service({
    name: 'JsonPipe'
})
export function JsonXPipe() {
    this.compile = function (value, type) {
        if (value) {
            if (Array.isArray(value)) {
                if (type === 'c')
                    value = value.toString();
                else if (type === 's')
                    value = value.join(' ')
                else if (type == 'cs')
                    value = conditionParser$.toString(value);
                else if (type === 'akvpnl')
                    value = value.map(kv => this.stripToEqual(kv)).join('\n')
            } else if (typeof value === 'object') {
                if (type.startsWith('e'))
                    value = this.stripToEqual(value, type.includes('lb'), type == 'elbc');
                /**
                * Any type pattern = | {}
                *  if (value.style) return as json string
                */
                else if (value.style)
                    value = JSON.stringify(value, null, 2)
                else
                    value = this.stripToEqual(value);
            }
        }
        return value;
    }
}

/**
 * 
 * @param {*} value 
 * @param {*} nls 
 * @param {*} hc 
 * @returns 
 */
JsonXPipe.prototype.stripToEqual = function (value, nls, hc) {
    var res = [];
    var write = (key, cvalue) => {
        if (cvalue && typeof cvalue === 'object') {
            /**
             * check if key endsWith any of the following prefix [ids., .conditions, .where]
             */
            if (key && hc && (key.startsWith('ids.') || key.endsWith('.conditions') || (key.endsWith('.where') && 'string' != typeof cvalue[0]))){
                res.push(key + '=' + conditionParser$.idsToString(cvalue, key.startsWith('ids.')));
            }  else {
                Object.keys(cvalue).forEach(ckey => write(((key ? key + '.' : '') + ckey), cvalue[ckey]));
            }
        } else {
            res.push(key + '=' + cvalue);
        }
    };

    write(null, value);
    return res.join(nls ? '\n' : ' ');
}