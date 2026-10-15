import { UploadService } from "./upload.service";
import { EventEmitter } from '@jeli/core';

Directive({
    selector: 'fileInstantUpload',
    events: ['click:event=onClickAction($event)', 'onFileUpload:emitter'],
    props: ['settings', 'id'],
    DI: [UploadService, 'changeDetector?']
})
export class FileInstantUploadDirective {
    static get defaultSettings() {
        return {
            multiple: true,
            imageListPreview: true,
            skipFileProcessing: false,
            autoOpenAndClose: false
        };
    }

    constructor(uploadService, changeDetector) {
        this.uploadService = uploadService;
        this.changeDetector = changeDetector;
        this.supportsFilePicker = !!window.showOpenFilePicker;
        this.fileElement = null;
        this.onFileUpload = new EventEmitter();
        this._settings = Object.assign(UploadService.defaultSettings, FileInstantUploadDirective.defaultSettings);
    }

    set settings(value){
        UploadService.extendObj(this._settings, value);
    }

    get settings(){
        return this._settings;
    }

    didInit() {
        if (!this.supportsFilePicker) {
            var filePickerConfig = Object.assign({ id: this._id }, this._settings);
            this.fileElement = this.uploadService.htmlFilePicker(filePickerConfig, files => this.uploadImage(files));
        }
    }
    onClickAction(event) {
        if (this.fileElement) {
            this.fileElement.click();
        } else if (this.supportsFilePicker) {
            this.uploadService.fromFilePicker(this._settings)
                .then(processed => this.uploadImage(processed));
        }
    }
    uploadImage(processed) {
        if (processed.invalid.length && !processed.readyForUpload.length) {
            return this.onFileUpload.emit({ invalid: processed.invalid });
        }

        this.uploadService.multipartUpload(processed.readyForUpload, this._settings)
            .then(res => this.onFileUpload.emit({ source: res.result }), err => this.onFileUpload.emit({ err }));
    }

    viewDidDestroy() {
        if (this.fileElement) {
            document.body.removeChild(this.fileElement.form);
            this.fileElement = null;
        }

        this.onFileUpload.destroy();
    }
}




