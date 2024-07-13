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
UploadService.prototype.upload = function (data) {
    return this.databaseService.core.api({ path: '/v2/uploads', data, method: "PUT" });
}

UploadService.prototype.getFile = function (data) {
    return this.databaseService.core.api({ path: '/uploads', data, method: "GET" });
}

UploadService.prototype.getPath = function () {
    return Array.from(arguments).filter(it => ![null, undefined].includes(it)).join('/');
}

UploadService.prototype.removeImage = function (data) {
    return this.databaseService.core.api({ path: '/v2/uploads', data, method: "DELETE" })
}

UploadService.prototype.createProcessObj = function (accepts, maximumFileSize, imageListPreview) {
    return ({ accepts, maximumFileSize, imageListPreview });
}

UploadService.prototype.getPresignedUrl = function(payload) {
    return  this.databaseService.core.api('/v2/s3/bucket/upload', payload);
}

/**
 * 
 * @param {*} presignedAttr 
 * @param {*} processedFiles 
 * @param {*} prefix 
 * @returns 
 */
UploadService.prototype.s3BucketUpload = function(presignedAttr, processedFiles, prefix) {
    /**
     * @param {*} f 
     * @param {*} filePath 
     * @returns 
     */
    var initUpload = (f, filePath) => {
        var formData = new FormData();
        if (prefix && !prefix.endsWith('/') && !filePath.startsWith('/'))
            prefix += '/';

        formData.append('Key',  prefix + filePath);
        // construct formData payload
        for (var key in presignedAttr.formData) {
            if (key !== 'key') {
                formData.append(key, presignedAttr.formData[key]);
            }
        }

        // append the file
        formData.append('file', f);
        return fetch(presignedAttr.attrs.action, {
            method: presignedAttr.attrs.method,
            body: formData
        })
    };

   return Promise.all(processedFiles.readyForUpload.map((t, i) => initUpload(t, processedFiles.selectedFiles[i].path)));
}

/**
 * 
 * @param {*} filesToUpload 
 * @param {*} uploadSettings 
 * @returns 
 */
UploadService.prototype.multipartUpload = function (filesToUpload, uploadSettings) {
    var data = new FormData();
    // append file to formData
    filesToUpload.forEach(function (file) {
        data.append('files[]', file);
    });
    // write the customData to the formData
    Object.keys(uploadSettings.formData).forEach(function (key) {
        data.append(key, uploadSettings.formData[key]);
    });

    return this.databaseService.core.api({ path: uploadSettings.url || '/v2/uploads', data, method: "POST" });
}

UploadService.prototype.fromFilePicker = function (config) {
    return window.showOpenFilePicker()
        .then(files => this.processFiles(Array.from(files), config));
}

/**
 * 
 * @param {*} files 
 * @param {*} config 
 * @returns 
 */
UploadService.prototype.processFiles = function (files, config, checkExists) {
    config.accepts = config.accepts || ['jpeg', 'jpg', 'png'];
    config.maximumFileSize = config.maximumFileSize || 1048576;
    checkExists = checkExists || function () { return false };

    var response = {
        invalid: [],
        readyForUpload: [],
        selectedFiles: [],
        allImages: true
    };

    var inc = 0;
    var imgRegExp = /^image/;
    var directoryInProcess = 0;

    /**
     * @param {*} item 
     * @param {*} next 
     */
    var scanFiles = (item, next) => {
        directoryInProcess++;
        if (item.isDirectory) {
            var directoryReader = item.createReader();
            directoryReader.readEntries(entries => {
                directoryInProcess += entries.length - 1;
                entries.forEach(entry => scanFiles(entry, next));
            });
        } else {
            item.file(file => {
                directoryInProcess--;
                pushItem(file, item.fullPath);
                next();
            });
        }
    };

    var pushInvalid = item => response.invalid[config.scanDirs ? 'push' : 'unshift']({ name: item.name, size: item.size });
    var pushSelected = (item, path) => response.selectedFiles.push({ name: item.name, path, size: item.size });

    /**
     * 
     * @param {*} item 
     * @param {*} path 
     * @returns 
     */
    var pushItem = (item, path) => {
        // remove / from path if it starts with a /
        path = path.startsWith('/') ? path.substr(1) : path;
        if (config.ignoreDotFiles && item.name.startsWith('.') || checkExists(path)) {
            return pushInvalid(item);
        }

        var ext = item.name.split('.').pop();
        // validate image size and format
        if ((config.accepts != '*' && !config.accepts.includes(ext)) || item.size > config.maximumFileSize) {
            pushInvalid(item);
        } else {
            response.readyForUpload.unshift(item);
            if (!config.imageListPreview) {
                pushSelected(item, path);
            }
        }

        // set flag for allImages
        if (!imgRegExp.test(item.type)) {
            response.allImages = false;
        }
    };

    var getFileEntry = (file) => {
        if (!!file.webkitGetAsEntry) return file.webkitGetAsEntry();
        else if (!!file.getAsEntry) return file.getAsEntry();

        return null;
    };

    /**
     * @param {*} next 
     */
    function _process(next) {
        var file = files[inc];
        // get the file entry
        var item = getFileEntry(file);
        if (config.scanDirs && item) {
            // can files and only trigger next when all done
            scanFiles(item, () => {
                if (directoryInProcess <= 0) next();
            });
        } else if (file instanceof FileSystemFileHandle) {
            file.getFile().then(file => {
                pushItem(file, '');
                next();
            }); 
        } else {
            pushItem(file, '');
            next();
        }
    }

    function start(callBack) {
        function next() {
            inc++;
            if (!files[inc])
                callBack();
            else {
                _process(next)
            }
        }
        // start the process
        _process(next);
    }

    return new Promise((resolve) => {
        start(function () {
            resolve(response);
        });
    });
}

/**
 * 
 * @param {*} mutiple 
 * @param {*} id 
 * @param {*} listener 
 */
UploadService.prototype.htmlFilePicker = function (multiple, id, listener, autoOpenAndClose, skipFileProcessing) {
    var formElement = document.createElement('form');
    formElement.className = "d-none";
    var fileElement = document.createElement('input');
    fileElement.type = 'file';
    fileElement.multiple = multiple;
    fileElement.id = (id || +new Date);
    formElement.appendChild(fileElement);
    document.body.appendChild(formElement);
    fileElement.addEventListener('change', event => {
        if (skipFileProcessing) {
            listener(event.target.files);
        } else {
            this.processFiles(event.target.files).then(listener);
        }

        event.target.form.reset();
        if (autoOpenAndClose) {
            formElement.remove();
        }
    });

    if (autoOpenAndClose) {
        return fileElement.click();
    }

    return fileElement;
};