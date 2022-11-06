import { UtilsService } from "./ck-utils.service";

Element({
    selector: 'fo-ckeditor',
    templateUrl: './fo-ckeditor.element.html',
    styleUrl: './fo-ckeditor.element.scss',
    props: ['placeHolder', 'content'],
    DI: [UtilsService]
})
export function FoCkeditorElement(utilService) {
    this.editorContext = null;
    this.utilService = utilService;
}

FoCkeditorElement.prototype.viewDidLoad = function() {
    var _this = this;
    this.utilService.openEditor(function(editor) {
        _this.editorContext = editor;
        if (_this.content) {
            editor.setData(_this.content);
        }
    });
}