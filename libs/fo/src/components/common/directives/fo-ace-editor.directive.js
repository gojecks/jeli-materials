import { LazyLoader, EventEmitter } from '@jeli/core';
Directive({
    selector: "foAceEditor",
    DI: ['ElementRef?'],
    props: ['version=:foAceEditor', 'mode'],
    events: ['editorLoaded:emitter']
})
export function FoAceEditorDirective(elementRef) {
    this.editor = null;
    this.editorLoaded = new EventEmitter();
    this.elementRef = elementRef;
}

FoAceEditorDirective.prototype.didInit = function() {
    LazyLoader.staticLoader(['https://cdnjs.cloudflare.com/ajax/libs/ace/' + this.version + '/ace.js'], () => {
        this.editor = ace.edit(this.elementRef.nativeElement);
        this.editor.setTheme("ace/theme/monokai");
        this.editor.session.setMode("ace/mode/" + this.mode);
        this.editorLoaded.emit(true);
    }, 'js');
}