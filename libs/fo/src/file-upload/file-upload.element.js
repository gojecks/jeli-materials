import { EventEmitter } from '@jeli/core';
import { blobURL, readFileMultiple } from '../utils';
import { UploadService } from './upload.service';

Element({
    selector: 'fo-file-upload',
    templateUrl: './file-upload.element.html',
    styleUrl: './file-upload.element.scss',
    events: [
        'onImageSelected:emitter',
        'onImagePreviewAction:emitter',
        'onImageUploaded:emitter',
        'onFileRemoved:emitter'
    ],
    props: ['label', 'settings', 'buttonText', 'value'],
    DI: ['changeDetector?', UploadService]
})
export class FileUploadElement {
    static get defaultSettings() {
        return {
            multiple: true,
            useCamera: false,
            camera: {
                width: 320,
                height: 320
            },
            // only used when imageListPreview is on
            previewPane: {
                width: 100,
                height: 100
            },
            allowSinglePreview: false,
            imageListPreview: false,
            autoUpload: false,
            showUploadBtn: false,
            imagePreview: {
                size: 'col',
                gridClass: '',
                imgClass: '',
                allowPreview: true,
                canDelete: true
            },
            clearFilesAfterUpload: false,
            maximumFilesToUpload: 1000
        };
    }

    label = 'Choose or drag a file here.';
    onFileRemoved = new EventEmitter();
    onImageSelected = new EventEmitter();
    onImageUploaded = new EventEmitter();
    onImagePreviewAction = new EventEmitter();
    constructor(changeDetector, uploadService) {
        this.uploadService = uploadService;
        this.changeDetector = changeDetector;
        this.showCamera = false;
        this.id = +new Date;
        this.selectedFiles = [];
        this.dragClass = '';
        this.errorMessages = [];
        this.uploadInProgress = false;
        this.uploadProgress = 0;
        this._uploadFiles = [];
        this.selectedFileErrors = null;
        this.value = null;
        this._settings = Object.assign(UploadService.defaultSettings, FileUploadElement.defaultSettings);
    }
    
    set settings(value) {
        UploadService.extendObj(this._settings, value);
    }

    get canUploadImages(){
        return (!this.value || (this.value && this.value.files.length < this._settings.maximumFilesToUpload));
    }

    get totalFiles(){
        return ((this.value && this.value.files.length || 0) + this._uploadFiles.length);
    }
    
    didInit() {
    }

    onFileSelected($event) {
        //reset form
        this.processSelectedFiles($event.target.files);
        $event.target.form.reset();
    }
    processSelectedFiles(files) {
        files = Array.from(files);
        var imgRegExp = /^image/;
        // remove previously selected files if not multiple selection
        if (!this._settings.multiple) {
            this.selectedFiles.length = 0;
            this._uploadFiles.length = 0;
        }

        // validate selected files
        this.uploadService.processFiles(files, this._settings)
            .then(processed => {
                // make sure there are files to upload before proceeding 
                if (!processed.readyForUpload.length || (processed.invalid.length && !processed.readyForUpload.length)) {
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
            });
    }
    
    removeImage(idx) {
        if (this._settings.autoUpload && this.uploadInProgress) return;
        this.onFileRemoved.emit({ index: idx });
        this.selectedFiles.splice(idx, 1);
        this._uploadFiles.splice(idx, 1);
        if (!this.selectedFiles.length) {
            this.errorMessages = [];
            this.uploadError = false;
            this.selectedFileErrors = null;
        }
    }

    listenCameraAction(event) {
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
    }
    takeAction() {
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
    blockForm() {
        return false;
    }
    uploadImage() {
        if (!this._uploadFiles.length) return;
        if (this.totalFiles > this._settings.maximumFilesToUpload) return false;

        this.uploadInProgress = true;
        this.errorMessages = [];
        this.uploadError = false;
        this.uploadProgress = 10;
        const attemptedFiles = this._uploadFiles.slice();
        this.uploadService.multipartUpload(attemptedFiles, this._settings)
            .progress(ev => {
                this.uploadProgress = ev;
                this.changeDetector.onlySelf();
            })
            .then(res => {
                if (res.result.errors) {
                    this.errorMessages = res.result.errors;
                    // don't resend files the server already confirmed - only retry the rest
                    this._uploadFiles = UploadService.unmatchedFiles(attemptedFiles, res.result.files);
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

    uploadDone(hasError) {
        this.uploadError = hasError;
        this.uploadProgress = 100;
        this.uploadInProgress = false;
        if (!hasError)
            this._uploadFiles = [];
        this.onImageUploaded.emit({hasError});
        if (!hasError && this._settings.clearFilesAfterUpload){
            this.selectedFiles.length = 0;
            this._uploadFiles.length = 0;
        }
        this.changeDetector.onlySelf();
    }
    fileDragDropEvent(event) {
        event.preventDefault();
        event.stopPropagation();
        this.dragClass = ['drop', 'dragleave'].includes(event.type) ? '' : 'is-dragover';
        if (event.type == 'drop') {
            var dataTransfer = (event.originalEvent || event).dataTransfer;
            var isFileTransfer = (dataTransfer.types.length == 1 && dataTransfer.types[0].toLowerCase() == 'files');
            this.processSelectedFiles(!isFileTransfer ? dataTransfer.items : dataTransfer.files);
        }
    }
}