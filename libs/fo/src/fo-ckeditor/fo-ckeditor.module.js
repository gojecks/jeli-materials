import { CommonModule } from '@jeli/common';
import { UtilsService } from './ck-utils.service';
import { CkeditorUploadAdapterService } from './ckeditor-upload-adapter.service';
import { FoCkeditorElement } from './fo-ckeditor.element';
import { FormModule } from '@jeli/form';


jModule({
    requiredModules: [
        CommonModule,
        FormModule
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