import { AUTH_DATABASE_SERIVCE } from '../fo-auth/tokens';
Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export function UploadService(databaseService) {
    this.allowAdvanceUpload = !!window.FormData;
    this.databaseService = databaseService;
}

/**
 * 
 * @param {*} requestBody 
 * @param {*} folderPath 
 * @param {*} sizes 
 * @returns 
 */
UploadService.prototype.upload = function(data) {
    return this.databaseService.core.api({ path: '/v2/uploads', data, method: "PUT" });
}

UploadService.prototype.getFile = function(data) {
    return this.databaseService.core.api({ path: '/uploads', data, method: "GET" });
}

UploadService.prototype.getPath = function() {
    return Array.from(arguments).filter(it => ![null,undefined].includes(it)).join('/');
}

UploadService.prototype.removeImage = function(data) {
    return this.databaseService.core.api({ path: '/v2/uploads', data, method: "DELETE" })
}

/**
 * 
 * @param {*} filesToUpload 
 * @param {*} uploadSettings 
 * @returns 
 */
UploadService.prototype.multipartUpload = function(filesToUpload, uploadSettings) {
    var formData = new FormData();
    // append file to formData
    filesToUpload.forEach(function(file) {
        formData.append('files[]', file);
    });
    // write the customData to the formData
    Object.keys(uploadSettings.formData).forEach(function(key) {
        formData.append(key, uploadSettings.formData[key]);
    });

    return this.databaseService.core.api({ path: uploadSettings.url || '/v2/uploads', data: formData, method: "POST" });
}

UploadService.prototype.fromFilePicker = function(accepts, maximumFileSize, allowPreview){
    return window.showOpenFilePicker()
    .then(files => {
        return Promise.all(Array.from(files).map(file => file.getFile())).then(files => this.processFiles(files, accepts, maximumFileSize, allowPreview))
    });
}

UploadService.prototype.processFiles = function(files, accepts, maximumFileSize, allowPreview){
    var response = {
        invalid: [],
        readyForUpload: [],
        selectedFiles: [],
        allImages: true
    };
    
    var imgRegExp = /^image/;
    accepts = accepts || ['jpeg', 'jpg', 'png'];
    for(var file of files) {
        var ext = file.name.split('.').pop();
        // validate image size and format
        if (!accepts.includes(ext) || file.size > maximumFileSize) {
            response.invalid.unshift({ name: file.name, size: file.size });
        } else {
            response.readyForUpload.unshift(file);
            if (!allowPreview){
                response.selectedFiles.push({ name: file.name });
            }
        }

        // set flag for allImages
        if (!imgRegExp.test(file.type)) {
            response.allImages = false;
        }
    }

    return response;
}

/**
 * 
 * @param {*} mutiple 
 * @param {*} id 
 * @param {*} listener 
 */
UploadService.prototype.htmlFilePicker = function(multiple, id, listener, autoOpenAndClose, skipFileProcessing){
    var formElement = document.createElement('form');
    formElement.className = "d-none";
    var fileElement = document.createElement('input');
    fileElement.type = 'file';
    fileElement.multiple = multiple;
    fileElement.id = (id || +new Date);
    formElement.appendChild(fileElement);
    document.body.appendChild(formElement);
    fileElement.addEventListener('change', event => {
        var processed = skipFileProcessing ? event.target.files : this.processFiles(event.target.files);
        listener(processed);
        event.target.form.reset();
        if (autoOpenAndClose){
            formElement.remove();
        }
        processed = null;
    });

    if (autoOpenAndClose) {
        return fileElement.click();
    }

    return fileElement;
};