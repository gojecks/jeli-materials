import {DOMHelper} from '@jeli/core';
Element({
    selector: 'fo-pretty-print',
    styleUrl: './pretty-print.element.scss',
    props: ['data'],
    DI: ['HostElement?']
})
export function PrettyPrintElement(hostElement) {
    this.contentView = null;
    this.hostElement = DOMHelper.createElement('pre', null, null, hostElement.nativeElement);
}

PrettyPrintElement.prototype.didChange = function(model) {
    if (model.data) {
        this.hostElement.innerHTML = this.prettyPrint(model.data);
    }
}

PrettyPrintElement.prototype.replacer = function(match, pIndent, pKey, pVal, pEnd) {
    var key = '<span class=json-key>';
    var val = '<span class=json-value>';
    var str = '<span class=json-string>';
    var r = pIndent || '';
    if (pKey)
        r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
    if (pVal)
        r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
    return r + (pEnd || '');
}

PrettyPrintElement.prototype.prettyPrint = function(obj) {
    var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
    return JSON.stringify(obj, null, 3)
        .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(jsonLine, this.replacer);
}