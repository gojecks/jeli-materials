import { ImageTheatreService } from "../../image-theatre/image-theatre.service";
import { UploadService } from "../upload.service";
import { moveItemInArray } from '@jeli/helpers';

Element({
    selector: 'fo-image-preview',
    templateUrl: './image-preview.element.html',
    styleUrl: './image-preview.element.scss',
    props: [
        'photos', 
        'options',
        'formData'
    ],
    DI: [UploadService, ImageTheatreService, 'changeDetector?'],
    events: ['onImagePreviewAction:emitter']
})
export class ImagePreviewElement {
    constructor(uploadService, imageTheatreService, changeDetector) {
        this.uploadService = uploadService;
        this.changeDetector = changeDetector;
        this.options = {
            allowPreview: false,
            gridClass: null,
            canDelete: false,
            size: 'col'
        };

        this.imageTheatreService = imageTheatreService;
        this.loadedImages = [];
        this.selectedDragIdx = null;
        this.onImagePreviewAction = new EventEmitter();
    }

    removeImage(idx) {
        if (this.options.canDelete) {
            const file = this.photos.files[idx];
            this.photos.files.splice(idx, 1);
            this.loadedImages.splice(idx, 1);
            if (!file.isLinked && this.formData) {
                // remove image from server
                this.uploadService.removeImage({
                    file: file,
                    path: this.formData.path
                }).then(() => this.onImagePreviewAction.emit({action: 'unlink', file}));
            }
        }
    }
    openTheatre(idx) {
        if (this.options.allowPreview) {
            const theatreObject = Object.assign({ entry: idx }, this.photos);
            this.imageTheatreService.startTheatreEvent.emit(theatreObject);
        } else if (this.options.canDelete) {
            if (this.selectedDragIdx == null) {
                this.selectedDragIdx = idx;
                return;
            }
            // reorder image
            moveItemInArray(this.photos.files, this.selectedDragIdx, idx);
            this.selectedDragIdx = null;
            this.changeDetector.detectChanges();
        }
    }
    viewDidDestroy() {
        this.photos = null;
        this.imageTheatreService.startTheatreEvent.emit(null);
    }

    onImageDrag(event, idx) {
        if (!this.options.canDelete) return;
        if (['drop', 'dragover'].includes(event.type)) {
            event.preventDefault();
            if (event.type == 'drop') {
                moveItemInArray(this.photos.files, this.selectedDragIdx, idx);
                this.onImagePreviewAction.emit({action: 'dragDrop'});
            }
        } else {
            this.selectedDragIdx = idx;
        }
    }

    action(nodeName, idx){
        const actions = {
            button: () => this.removeImage(idx),
            img: () => this.openTheatre(idx)
        };

        actions[nodeName]();
    }

    addLoaded(idx, success){
        this.loadedImages[idx] = ({
            success
        });
    }
}
