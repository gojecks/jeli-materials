import { EventEmitter } from '@jeli/core';
import { blobURL, readFileMultiple } from '../utils';
import { UploadService } from './upload.service';

Element({
    selector: 'fo-file-upload',
    templateUrl: './file-upload.element.html',
    styleUrl: './file-upload.element.scss',
    events: [
        'onImageSelected:emitter'
    ],
    props: ['label', 'settings', 'buttonText', 'value'],
    DI: ['changeDetector?', UploadService]
})
export function FileUploadElement(changeDetector, uploadService) {
    this.uploadService = uploadService;
    this.changeDetector = changeDetector;
    this.showCamera = false;
    this.onImageSelected = new EventEmitter();
    this.onImageUploaded = new EventEmitter();
    this.id = +new Date
    this.selectedFiles = [];
    this.dragClass = '';
    this.errorMessages = [];
    this.uploadInProgress = false;
    this.uploadProgress = 0;
    this._uploadFiles = [];
    this.selectedFileErrors = null;
    this._value = null;
    this._settings = {
        /**
         * allow multiple file upload
         */
        multiple: true,
        /**
         * allow camera usage
         */
        useCamera: false,
        /**
         * camera canvas dimension
         */
        camera: {
            width: 320,
            height: 320
        },
        /**
         * preview pane dimension for selected images
         * will be used for imageListPreview
         */
        previewPane: {
            width: 100,
            height: 100
        },
        /**
         * allow imagePreview for Single Image
         */
        allowSinglePreview: false,
        /**
         * set to true to use imageListPreview
         */
        imageListPreview: false,
        accepts: ['jpeg', 'jpg', 'png'],
        /**
         * set to true to auto upload images once selected
         */
        autoUpload: false,
        /**
         * show upload button if autoUpload is false
         */
        showUploadBtn: false,
        /**
         * formData that will passed along the selected images for uploading
         */
        formData: {
            path: "",
            sizes: [],
            replaceIfExists: false,
            allowDuplicate: false
        },
        maximumFileSize: 1048576, // 1MB in bytes
        // default url for FO
        url: '/v2/uploads',

        // allow Dir Scanning when dragNdrop is used
        scanDirs: false,
        
        // Files starting with . will be removed
        ignoreDotFiles: true
    };


    Object.defineProperties(this, {
        settings: {
            set: function(value) {
                this._settings = Object.assign(this._settings, value);
            }
        }
    });
}

FileUploadElement.prototype.didInit = function() {

}

FileUploadElement.prototype.onFileSelected = function($event) {
    //reset form
    this.processSelectedFiles($event.target.files);
    $event.target.form.reset();
}

FileUploadElement.prototype.processSelectedFiles = function(files){
    files = Array.from(files);
    var imgRegExp = /^image/;
    // remove previously selected files if not multiple selection
    if (!this._settings.multiple) {
        this.selectedFiles.length = 0;
        this._uploadFiles.length = 0;
    }

    // validate selected files
    this.uploadService.processFiles(files, this._settings)
    .then( processed => {
        // make sure there are files to upload before proceeding 
        if (!processed.readyForUpload.length  || (processed.invalid.length && !processed.readyForUpload.length)) {
            this.selectedFileErrors = processed.invalid;
            return this.changeDetector.onlySelf();
        }

        this._uploadFiles = processed.readyForUpload;
        this.selectedFiles = processed.selectedFiles;
        // previews are only allowded for images
        if (this._settings.imageListPreview && processed.allImages) {
            readFileMultiple(processed.readyForUpload, imgRegExp, true)
                .then(processedFiles => {
                    this.selectedFiles.push.apply(this.selectedFiles, processedFiles);
                    this.takeAction();
                });
        } else {
            this.takeAction();
        }
    })
}

FileUploadElement.prototype.removeImage = function(idx) {
    if (this._settings.autoUpload) return;
    this.selectedFiles.splice(idx, 1);
    this._uploadFiles.splice(idx, 1);
    if (!this.selectedFiles.length && this.errorMessages.length) {
        this.errorMessages = [];
        this.uploadError = false;
    }
}

FileUploadElement.prototype.listenCameraAction = function(event) {
    this.showCamera = false;
    if (event && event.content) {
        if (!this._settings.multiple) {
            this.selectedFiles = [];
            this._uploadFiles = [];
        }

        this.selectedFiles.push({
            blobURL: blobURL(event.content)
        });
        this._uploadFiles.push(event);
        this.takeAction();
    }
};

FileUploadElement.prototype.takeAction = function() {
    if (this._settings.autoUpload) {
        this.uploadImage();
    } else if (!this._settings.showUploadBtn) {
        this.onImageSelected.emit({
            source: this.selectedFiles,
            raw: this._uploadFiles
        });
    }
    this.changeDetector.onlySelf();
}

FileUploadElement.prototype.blockForm = function() {
    return false;
}

FileUploadElement.prototype.uploadImage = function() {
    if (!this._uploadFiles.length) {
        return;
    }

    this.uploadInProgress = true;
    this.errorMessages = [];
    this.uploadError = false;
    this.uploadProgress = 10;
    this.uploadService.multipartUpload(this._uploadFiles, this._settings)
        .progress(ev => {
            this.uploadProgress = ev;
            this.changeDetector.onlySelf();
        })
        .then(res => {
            if (res.result.errors) {
                this.errorMessages = res.result.errors;
                this.uploadDone(true);
            } else {
                this.onImageSelected.emit({
                    source: res.result
                });
                this.uploadDone(false);
            }
        }, err => {
            this.uploadDone(true);
        });
}

FileUploadElement.prototype.uploadDone = function(hasError) {
    this.uploadError = hasError;
    this.uploadProgress = 100;
    this.uploadInProgress = false;
    if (!hasError) {
        this._uploadFiles = [];
    }
    this.changeDetector.onlySelf();
}

FileUploadElement.prototype.fileDragDropEvent = function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dragClass = ['drop', 'dragleave'].includes(event.type) ? '':'is-dragover';
    if (event.type == 'drop') {
        var dataTransfer = (event.originalEvent || event).dataTransfer;
        this.processSelectedFiles(dataTransfer.items || dataTransfer.files);
    }
}