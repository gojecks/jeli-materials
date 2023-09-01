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
    return this.databaseService.core.api({ path: '/attachment', data, method: "PUT" });
};

UploadService.prototype.getPath = function() {
    return Array.from(arguments).filter(function(item) { return !!item; }).join('/');
}

UploadService.prototype.removeImage = function(data) {
    return this.databaseService.core.api({ path: '/attachment', data, method: "DELETE" })
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

    return this.databaseService.core.api({ path: uploadSettings.url || '/attachment', data: formData, method: "POST" });
}