import { CommonModule } from '@jeli/common';
import { FileUploadElement } from './file-upload.element';
import { CameraElement } from './camera/camera.element';
import { FoDraggableModule } from '../draggable/draggable.module';
import { ImagePreviewElement } from './image-preview/image-preview.element';
import { ImageTheatreModule } from '../image-theatre/image-theatre.module';
import { FileUploadDragDirective } from './file-upload-drag.directive';


jModule({
    requiredModules: [
        CommonModule,
        FoDraggableModule,
        ImageTheatreModule
    ],
    selectors: [
        FileUploadElement,
        CameraElement,
        ImagePreviewElement,
        FileUploadDragDirective
    ]
})
export function FileUploadModule() {}