import { CommonModule } from '@jeli/common';
import { UtilsService } from './ck-utils.service';
import { CkeditorUploadAdapterService } from './ckeditor-upload-adapter.service';
import { FoCkeditorElement } from './fo-ckeditor.element';


jModule({
    requiredModules: [
        CommonModule
    ],
    services: [
        UtilsService,
        CkeditorUploadAdapterService
    ],
    selectors: [
        FoCkeditorElement
    ]
})
export function FoCkeditorModule() {}