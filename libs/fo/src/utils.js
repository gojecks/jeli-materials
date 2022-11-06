export function base64ToFile(base64Image) {
    var split = base64Image.split(',');
    var type = split[0].replace('data:', '').replace(';base64', '');
    var byteString = atob(split[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: type });
}

export function blobURL(base64Image) {
    return URL.createObjectURL(base64ToFile(base64Image));
}

/**
 * 
 * @param {*} file 
 * @param {*} regEx 
 * @param {*} asObject 
 * @returns 
 */
export function readFile(file, regEx, asObject) {
    return new Promise(function(resolve, reject) {
        var fileReader = new FileReader();
        try {
            if (file && regEx.test(file.type)) {
                fileReader.readAsDataURL(file);
            } else {
                reject(null);
            }
        } catch (e) {
            reject(null);
        }

        fileReader.onload = function(content) {
            if (asObject) {
                resolve({
                    name: file.name,
                    content: content.target.result,
                    blobURL: blobURL(content.target.result)
                });
            } else {
                resolve(content.target.result);
            }
        };
    });
}

/**
 * 
 * @param {*} fileList 
 * @param {*} regEx 
 * @param {*} asObject 
 * @returns 
 */
export function readFileMultiple(fileList, regEx, asObject) {
    return Promise.all(fileList.map(function(file) { return readFile(file, regEx, asObject) }));
}