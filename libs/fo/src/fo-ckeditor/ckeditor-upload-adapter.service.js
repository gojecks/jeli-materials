import { readFile } from "../utils";
import { UploadService } from "../file-upload/upload.service";


Service({
    DI: [UploadService]
})
export function CkeditorUploadAdapterService(uploadService) {
    this.uploadService = uploadService;
    this.loader = null;
}

CkeditorUploadAdapterService.prototype.upload = function() {
    return this.loader.file
        .then((file) => {
            return new Promise((resolve, reject) => {
                readFile(file, /^image/)
                    .then(base64Image => {
                        this.uploadService.upload({
                                file: base64Image,
                                fileName: file.name,
                                fullPath: true,
                                path: 'photos/'
                            })
                            .then(function(res) {
                                var url = [res.result.fileUrl, res.result.files[0].parent, res.result.files[0].name].join('');
                                resolve({
                                    default: url,
                                    '160': url + '&s=160x160',
                                    '500': url + '&s=500x500',
                                    '1000': url + '&s=10000x1000',
                                    '1052': url + '&s=1052x1052'
                                });
                            }, reject);
                    })
            });
        });
}