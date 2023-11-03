import { LazyLoader, EventEmitter } from '@jeli/core';
Directive({
    selector: "foAceEditor",
    DI: ['ElementRef?'],
    props: ['version=:foAceEditor', 'mode', 'events'],
    events: ['editorLoaded:emitter', 'editorValueChanged:emitter']
})
export function FoAceEditorDirective(elementRef) {
    this.editor = null;
    this.editorLoaded = new EventEmitter();
    this.editorValueChanged  = new EventEmitter();
    this.elementRef = elementRef;
    this.events = [];
}

FoAceEditorDirective.prototype.didInit = function() {
    LazyLoader.staticLoader(['https://cdnjs.cloudflare.com/ajax/libs/ace/' + this.version + '/ace.js'], () => {
        this.editor = ace.edit(this.elementRef.nativeElement);
        this.editor.setTheme("ace/theme/monokai");
        this.editor.session.setMode("ace/mode/" + this.mode);
        this.editorLoaded.emit(this.editor);
        this.attachListener()
    }, 'js');
}

FoAceEditorDirective.prototype.attachListener = function(){
    var isJSON = this.mode == 'json';
    this.editor.on('change', () => {
        var value = this.editor.getValue();
        try {
            if (isJSON) {
                value = JSON.parse(value);
            }
        } catch(e){
            value = null;
        }

        this.editorValueChanged.emit(value);
    });
}