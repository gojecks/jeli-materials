import { LazyLoader, EventEmitter } from '@jeli/core';
Directive({
    selector: "foAceEditor",
    DI: ['ElementRef?'],
    props: ['version=:foAceEditor', 'theme', 'mode', 'events', 'readOnly'],
    events: ['editorLoaded:emitter', 'editorValueChanged:emitter']
})
export function FoAceEditorDirective(elementRef) {
    this.editor = null;
    this.editorLoaded = new EventEmitter();
    this.editorValueChanged  = new EventEmitter();
    this.elementRef = elementRef;
    this.events = [];
    this.readOnly = false;
    this.theme = 'monokai';
    this.version = '1.7.1';
}

FoAceEditorDirective.prototype.didInit = function() {
    LazyLoader.staticLoader(['https://cdnjs.cloudflare.com/ajax/libs/ace/' + this.version + '/ace.js'], () => {
        this.editor = ace.edit(this.elementRef.nativeElement);
        this.editor.setTheme('ace/theme/' + this.theme);
        this.editor.session.setMode("ace/mode/" + this.mode);
        // set as readOnly
        if (this.readOnly) {
            this.editor.session.setUseWorker(false);
            this.editor.setShowPrintMargin(false);
            this.editor.setReadOnly(true);
        }
        this.editorLoaded.emit(this.editor);
        this.attachListener()
    }, 'js');
}

FoAceEditorDirective.prototype.attachListener = function(){
    var isJSON = this.mode == 'json';
    this.editor.on('change', () => {
        var value = this.editor.getValue();
        try {
            if (value && isJSON) {
                value = JSON.parse(value);
            }
        } catch(e){
            value = null;
        }

        this.editorValueChanged.emit(value);
    });
}