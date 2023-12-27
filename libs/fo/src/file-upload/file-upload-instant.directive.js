import { UploadService } from "./upload.service";
import { EventEmitter } from '@jeli/core';

Directive({
    selector: 'fileInstantUpload',
    events: ['click:event=onClickAction($event)', 'onFileUpload:emitter'],
    props: ['settings', 'id'],
    DI: [UploadService, 'changeDetector?']
})
export function FileInstantUploadDirective(uploadService, changeDetector) {
    this.uploadService = uploadService;
    this.changeDetector = changeDetector;
    this.supportsFilePicker = !!window.showOpenFilePicker;
    this.fileElement = null;
    this.onFileUpload = new EventEmitter();
    this._settings = {
        formData: {
            path: "",
            sizes: [],
            replaceIfExists: false,
            allowDuplicate: false
        },
        maximumFileSize: 1048576, // 1MB in bytes
        url: '/v2/uploads'
    }

    Object.defineProperty(this, 'settings', {
        set: value => {
            Object.assign(this._settings, value || {});
        }
    });
}

FileInstantUploadDirective.prototype.didInit = function () {
    if (!this.supportsFilePicker) {
        this.fileElement = this.uploadService.createFilePicker(this._settings.multiple, this.id, files => this.uploadImage(files));
    }
}

FileInstantUploadDirective.prototype.onClickAction = function (event) {
    if (this.fileElement) {
        this.fileElement.click();
    } else if (this.supportsFilePicker) {
        this.uploadService.fromFilePicker(this._settings.accepts, this._settings.maximumFileSize, true)
            .then(processed => this.uploadImage(processed));
    }
}

FileInstantUploadDirective.prototype.uploadImage = function (processed) {
    if (processed.invalid.length && !processed.readyForUpload.length){
        return this.onFileUpload.emit({ invalid: processed.invalid }); 
    }

    this.uploadService.multipartUpload(processed.readyForUpload, this._settings)
        .then(res => this.onFileUpload.emit({ source: res.result }), err => this.onFileUpload.emit({ err }));
}

FileInstantUploadDirective.prototype.viewDidDestroy = function(){
    if (this.fileElement){
        document.body.removeChild(this.fileElement.form);
        this.fileElement = null;
    }
   
    this.onFileUpload.destroy();
}