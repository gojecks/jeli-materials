import { LazyLoader, EventEmitter } from '@jeli/core';

var modeMatchers = {
    js: 'javascript',
    py: 'python'
};

Directive({
    selector: "foAceEditor",
    DI: ['ElementRef?'],
    props: ['version=:foAceEditor', 'theme', 'mode', 'events', 'readOnly'],
    events: ['editorLoaded:emitter', 'editorValueChanged:emitter']
})
export class FoAceEditorDirective {
    constructor(elementRef) {
        this.editor = null;
        this.editorLoaded = new EventEmitter();
        this.editorValueChanged = new EventEmitter();
        this.elementRef = elementRef;
        this.events = [];
        this._mode = 'js';
        this.readOnly = false;
        this._theme = 'monokai';
        this.version = '1.36.4';
    }

    set mode(value){
        this._mode = value;
        if(this.editor){
            this.setMode();
        }
    }

    get mode(){
        return this._mode;
    }

    set theme(value){
        this._theme = value;
        if(this.editor){
            this.setTheme();
        }
    }

    get theme(){
        return this._theme;
    }

    didInit() {
        LazyLoader.staticLoader(['https://cdnjs.cloudflare.com/ajax/libs/ace/' + this.version + '/ace.js'], () => {
            this.editor = ace.edit(this.elementRef.nativeElement);
            this.setMode();
            this.setTheme();
            // set as readOnly
            if (this.readOnly) {
                this.editor.session.setUseWorker(false);
                this.editor.setShowPrintMargin(false);
                this.editor.setReadOnly(true);
            }
            this.editorLoaded.emit(this.editor);
            this.attachListener();
        }, 'js');
    }
    attachListener() {
        var isJSON = this.mode == 'json';
        this.editor.on('change', () => {
            var value = this.editor.getValue();
            try {
                if (value && isJSON) {
                    value = JSON.parse(value);
                }
            } catch (e) {
                value = null;
            }

            this.editorValueChanged.emit(value);
        });
    }

    setMode(){
        this.editor.session.setMode(`ace/mode/${(modeMatchers[this._mode] || this._mode)}`);
    }

    setTheme(){
        this.editor.setTheme('ace/theme/' + this._theme);
    }
}