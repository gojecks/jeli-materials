import { LazyLoader, ProviderToken } from '@jeli/core';
import { CkeditorUploadAdapterService } from './ckeditor-upload-adapter.service';

export var CKEDITOR_URL = new ProviderToken('ckEditorUrl', false, {
    value: ['https://cdn.ckeditor.com/ckeditor5/23.1.0/classic/ckeditor.js']
});

Service({
    DI: [CkeditorUploadAdapterService, CKEDITOR_URL]
})
export function UtilsService(ckeditorUploadAdapterService, ckeditorUrl) {
    this.openEditor = function(cb, err) {
        LazyLoader.staticLoader(ckeditorUrl, function() {
            // Depending on the wysiwygare plugin availability initialize classic or inline editor.
            // templates,section removed from extraPlugins
            ClassicEditor
                .create(document.querySelector('#postBody'), {
                    extraPlugins: [CustomUploadPlugin],
                })
                .then(cb)
                .catch(err || function(error) {});
        }, 'js');
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