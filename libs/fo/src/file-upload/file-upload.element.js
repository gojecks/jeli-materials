import { EventEmitter } from '@jeli/core';
import { blobURL, readFileMultiple } from '../utils';
import { UploadService } from './upload.service';
Element({
    selector: 'fo-file-upload',
    templateUrl: './file-upload.element.html',
    styleUrl: './file-upload.element.scss',
    events: [
        'drag dragstart dragend dragover dragenter dragleave drop:event=dragStart($event)',
        "dragover dragenter:event=dragEnter()",
        'dragleave dragend drop:event=dragLeave()',
        'drop:event=dragDrop($event)',
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
            sizes: []
        },
        maximumFileSize: 1048576, // 1MB in bytes
        // default url for FO
        url: '/attachment'
    };


    this.dragStart = function(e) {
        e.preventDefault();
        e.stopPropagation();
    };

    this.dragEnter = function(e) {
        this.dragClass = 'is-dragover';
    }

    this.dragLeave = function(e) {
        this.dragClass = '';
    }

    this.dragDrop = function(e) {
        var files = (e.originalEvent || e).dataTransfer.files;
        this.onSelectImage(files);
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

FileUploadElement.prototype.onSelectImage = function($event) {
    var files = Array.from($event.target.files);
    //reset form
    $event.target.form.reset();
    var allImages = true;
    var imgRegExp = /^image/;
    // remove previously selected files if not multiple selection
    if (!this._settings.multiple) {
        this.selectedFiles.length = 0;
        this._uploadFiles.length = 0;
    }

    // validate selected files
    this.selectedFileErrors = files.reduce((accum, file) => {
        var ext = file.name.split('.').pop();
        // validate image size and format
        if (!this._settings.accepts.includes(ext) || file.size > this._settings.maximumFileSize) {
            accum.push({ name: file.name, size: file.size });
        } else {
            this._uploadFiles.push(file);
            // push the image info  for display
            if (!this._settings.imageListPreview) {
                this.selectedFiles.push({ name: file.name });
            }
        }

        // set flag for allImages
        if (!imgRegExp.test(file.type)) {
            allImages = false;
        }

        return accum;
    }, []);

    // make sure there are files to upload before proceeding 
    if (this.selectedFileErrors.length && !this._uploadFiles.length) {
        return;
    }

    // previews are only allowded for images
    if (this._settings.imageListPreview && allImages) {
        readFileMultiple(this._uploadFiles, imgRegExp, true)
            .then((processedFiles) => {
                this.selectedFiles.push.apply(this.selectedFiles, processedFiles);
                this.takeAction();
            });
    } else {
        this.takeAction();
    }
};

FileUploadElement.prototype.removeImage = function(idx) {
    if (this._settings.autoUpload) {
        return;
    }

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
    if (!this._uploadFiles) {
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