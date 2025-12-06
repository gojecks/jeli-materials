import { AUTH_DATABASE_SERIVCE } from '../fo-auth/tokens';
Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export class UploadService {
    static createFormData(data) {
        var formData = new FormData();
        // write the customData to the formData
        Object.keys(data).forEach(key => {
            if (!Array.isArray(data[key]))
                formData.append(key, data[key]);
            else
                data[key].forEach(cval => formData.append(`${key}[]`, cval));
        });

        return formData;
    }

    static extendObj(a, b) {
        if (b && typeof b == 'object') {
            for (var key in b) {
                if (a[key] && typeof a[key] == 'object' && !Array.isArray(b[key])) {
                    Object.assign(a[key], b[key]);
                } else {
                    a[key] = b[key]
                }
            }
        }
    }

    static fileSizeToBytes(str){
        if (typeof str == 'number') return str;

        const sptFS = String(str || '1M').split(/(\d+)(\s|)+(K|M|B|T)/gi).filter(t => !!t );
        let fileSize = Number(sptFS.shift());
        switch(sptFS[0].toUpperCase()){
            case('M'):
                fileSize = fileSize * 1024 * 1024;
            break;
            case('G'):
                fileSize = fileSize * 1024 * 1024 * 1024;
            break;
            case ('T'):
                fileSize = fileSize * 1024 * 1024 * 1024 * 1024;
            break;
            case('K'):
            default:
                fileSize = fileSize * 1024;
            break;
        };

        return fileSize;
    }

    constructor(databaseService) {
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
    upload(data) {
        return this.databaseService.core.api({ path: '/v2/uploads', data, method: 'PUT' });
    }
    getFile(data) {
        return this.databaseService.core.api({ path: '/uploads', data, method: "GET" });
    }
    getPath() {
        return Array.from(arguments).filter(it => ![null, undefined].includes(it)).join('/');
    }
    removeImage(data) {
        return this.databaseService.core.api({ path: '/v2/uploads', data, method: "DELETE" });
    }
    createProcessObj(accepts, maximumFileSize, imageListPreview) {
        return ({ accepts, maximumFileSize, imageListPreview });
    }
    getPresignedUrl(payload) {
        return this.databaseService.core.api('/v2/s3/bucket/upload', payload);
    }
    /**
     *
     * @param {*} presignedAttr
     * @param {*} processedFiles
     * @param {*} prefix
     * @returns
     */
    s3BucketUpload(presignedAttr, processedFiles, prefix) {
        /**
         * @param {*} f
         * @param {*} filePath
         * @returns
         */
        var initUpload = (f, filePath) => {
            var formData = new FormData();
            if (prefix && !prefix.endsWith('/') && !filePath.startsWith('/'))
                prefix += '/';

            formData.append('Key', prefix + filePath);
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
            });
        };

        return Promise.all(processedFiles.readyForUpload.map((t, i) => initUpload(t, processedFiles.selectedFiles[i].path)));
    }
    /**
     *
     * @param {*} filesToUpload
     * @param {*} uploadSettings
     * @returns
     */
    multipartUpload(filesToUpload, uploadSettings) {
        var data = UploadService.createFormData(uploadSettings.formData);
        // append file to formData
        filesToUpload.forEach(function (file) {
            data.append('files[]', file);
        });

        return this.databaseService.core.api({ path: uploadSettings.url || '/v2/uploads', data, method: "POST" });
    }
    fromFilePicker(config) {
        return window.showOpenFilePicker()
            .then(files => this.processFiles(Array.from(files), config));
    }
    /**
     *
     * @param {*} files
     * @param {*} config
     * @returns
     */
    processFiles(files, config, checkExists) {
        config = Object.assign({ accepts: ['jpeg', 'jpg', 'png'] }, config || {});
        checkExists = checkExists || function () { return false; };

        const response = {
            invalid: [],
            readyForUpload: [],
            selectedFiles: [],
            allImages: true,
            totalFileSize: 0
        };

        let inc = 0;
        let directoryInProcess = 0;
        const imgRegExp = /^image/;
        const maximumFileSize = UploadService.fileSizeToBytes(config.maximumFileSize);

        const helpers = {
            scanFiles: (item, next) => {
                if (item.isDirectory) {
                    directoryInProcess--;
                    var directoryReader = item.createReader();
                    directoryReader.readEntries(entries => {
                        directoryInProcess += entries.length;
                        entries.forEach(entry => scanFiles(entry, next));
                    });
                } else {
                    item.file(file => {
                        directoryInProcess--;
                        helpers.pushItem(file, item.fullPath);
                        next();
                    });
                }
            },
            pushInvalid: item => response.invalid[config.scanDirs ? 'push' : 'unshift']({ name: item.name, size: item.size }),
            pushSelected: (item, path) => response.selectedFiles.push({ name: item.name, path, size: item.size }),
            pushItem: (item, path) => {
                // remove / from path if it starts with a /
                path = path.startsWith('/') ? path.substr(1) : path;
                if (config.ignoreDotFiles && item.name.startsWith('.') || checkExists(path)) {
                    return helpers.pushInvalid(item);
                }

                const ext = item.name.split('.').pop();
                // validate image size and format
                if ((config.accepts != '*' && !config.accepts.includes(ext)) || item.size > maximumFileSize) {
                    helpers.pushInvalid(item);
                } else {
                    response.readyForUpload.unshift(item);
                    response.totalFileSize += item.size;
                    if (!config.imageListPreview) {
                        helpers.pushSelected(item, path);
                    }
                }

                // set flag for allImages
                if (!imgRegExp.test(item.type)) {
                    response.allImages = false;
                }
            },
            getFileEntry: (file) => {
                if (!!file.webkitGetAsEntry) return file.webkitGetAsEntry();
                else if (!!file.getAsEntry) return file.getAsEntry();

                return null;
            },
            /**
         * @param {*} next
         */
            _process: next => {
                const file = files[inc];
                // get the file entry
                const item = helpers.getFileEntry(file);
                if (config.scanDirs && item) {
                    // can files and only trigger next when all done
                    directoryInProcess++;
                    helpers.scanFiles(item, () => {
                        if (directoryInProcess <= 0) next();
                    });
                } else if (file instanceof FileSystemFileHandle) {
                    file.getFile().then(file => {
                        helpers.pushItem(file, '');
                        next();
                    });
                } else {
                    helpers.pushItem(file, '');
                    next();
                }
            },
            start: callback => {
                const next = () => {
                    inc++;
                    if (!files[inc]) callback(response);
                    else helpers._process(next);
                };

                helpers._process(next);
            }
        };




        return new Promise((resolve) => helpers.start(resolve));
    }
    /**
     *
     * @param {*} config
     * @param {*} listener
     * @returns
     */
    htmlFilePicker(config, listener) {
        var formId = 'fo_html_file_picker';
        var formElement = document.querySelector(`form#${formId}`);
        if (!formElement) {
            formElement = document.createElement('form');
            formElement.className = "d-none";
            formElement.id = formId;
        }
        var fileElement = document.createElement('input');
        fileElement.type = 'file';
        fileElement.multiple = config.multiple;
        fileElement.id = (config.id || +new Date);
        formElement.appendChild(fileElement);
        document.body.appendChild(formElement);
        fileElement.addEventListener('change', event => {
            if (config.skipFileProcessing) {
                listener(event.target.files);
            } else {
                this.processFiles(event.target.files, config).then(listener);
            }

            event.target.form.reset();
            if (config.autoOpenAndClose) {
                formElement.remove();
            }
        });

        if (config.autoOpenAndClose)
            return fileElement.click();

        return fileElement;
    }
}