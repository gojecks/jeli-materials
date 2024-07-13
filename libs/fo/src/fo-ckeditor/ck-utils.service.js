import { LazyLoader, ProviderToken } from '@jeli/core';
import { CkeditorUploadAdapterService } from './ckeditor-upload-adapter.service';

export var CKEDITOR_URL = new ProviderToken('ckEditorUrl', false, {
    value: ['https://cdn.ckeditor.com/ckeditor5/{{version}}/{{distribution}}/ckeditor.js']
});

Service({
    DI: [CkeditorUploadAdapterService, CKEDITOR_URL]
})
export function UtilsService(ckeditorUploadAdapterService, ckeditorUrl) {
    this.openEditor = function(props, uploadConfig){
        return new Promise((resolve, reject) => {
            LazyLoader.staticLoader(ckeditorUrl.map(url => parserUrl(url, props)), function() {
                // Depending on the wysiwygare plugin availability initialize classic or inline editor.
                // templates,section removed from extraPlugins
                var element = document.getElementById(props.editorId || 'postBody');
                if (typeof ClassicEditor == 'function') {
                    ClassicEditor
                    .create(element || {}, {
                        extraPlugins: [CustomUploadPlugin],
                    })
                    .then(resolve, reject)
                    .catch(reject);
                } else {
                    reject({message: 'Editor Instance not found!'});
                }

            }, 'js');
        })
    }

    function parserUrl(url, props) {
        return url.replace(/\{\{([\w.]+)\}\}/g, (_, key) => props[key]);
    }

    /**
     * 
     * @param {*} editor 
     */
    function CustomUploadPlugin(editor) {
        editor.plugins.get('FileRepository').createUploadAdapter = function(loader) {
            // Configure the URL to the upload script in your back-end here!
            ckeditorUploadAdapterService.loader = loader;
            return ckeditorUploadAdapterService;
        };
    }
}