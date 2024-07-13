import { UtilsService } from "./ck-utils.service";
import {EventEmitter} from '@jeli/core';

Element({
    selector: 'fo-ckeditor',
    templateUrl: './fo-ckeditor.element.html',
    styleUrl: './fo-ckeditor.element.scss',
    events: ['onValueChanged:emitter'],
    props: ['placeHolder', 'content', 'version', 'distribution'],
    DI: [UtilsService]
})
export function FoCkeditorElement(utilService) {
    this.editorContext = null;
    this.utilService = utilService;
    this.id = 'fo-ckeditor-' + +new Date;
    this.onValueChanged  = new EventEmitter();
    this._content = '';
    this.version = '23.1.0';
    this.distribution = 'classic';

    Object.defineProperty(this, 'content', {
        set: value  => {
            this._content = value;
            if (this.editorContext) {
                this.editorContext.setData(this._content);
            }
        },
        get: () => this._content
    });
}

FoCkeditorElement.prototype.viewDidLoad = function() {
    this.utilService.openEditor({editorId:this.id, version: this.version, distribution:this.distribution}).then(editor => {
        this.editorContext = editor;
        if (this._content) {
            editor.setData(this._content);
        }
    });
}