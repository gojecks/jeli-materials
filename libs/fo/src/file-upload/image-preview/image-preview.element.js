import { ImageTheatreService } from "../../image-theatre/image-theatre.service";
import { UploadService } from "../upload.service";
import { moveItemInArray } from '@jeli/helpers';

Element({
    selector: 'fo-image-preview',
    templateUrl: './image-preview.element.html',
    styleUrl: './image-preview.element.scss',
    props: ['photos', 'formData', 'canDelete', 'allowPreview', 'size', 'gridClass', 'imgClass'],
    DI: [UploadService, ImageTheatreService]
})
export function ImagePreviewElement(uploadService, imageTheatreService) {
    this.uploadService = uploadService;
    this.allowPreview = false;
    this.gridClass  = null;
    this.formData = null;
    this.canDelete = false;
    this.size = 'col';
    this.imageTheatreService = imageTheatreService;
    this.loadedImages = 0;
}
ImagePreviewElement.prototype.removeImage = function(idx) {
    if (this.canDelete) {
        var file = this.photos.files[idx];
        this.photos.files.splice(idx, 1);
        if (!file.isLinked) {
            // remove image from server
            this.uploadService.removeImage({
                file: file,
                path: this.formData.path
            });
        }
    }
}

ImagePreviewElement.prototype.openTheatre = function(idx) {
    var theatreObject = Object.assign({ entry: idx }, this.photos);
    this.imageTheatreService.startTheatreEvent.emit(theatreObject);
}

ImagePreviewElement.prototype.viewDidDestroy = function(){
    this.photos = null;
    this.imageTheatreService.startTheatreEvent.emit(null);
}

ImagePreviewElement.prototype.onImageDrag = function(event, idx){
    if (['drop','dragover'].includes(event.type)) {
        event.preventDefault();
        if (event.type  == 'drop'){
            moveItemInArray(this.photos.files, this.selectedDragIdx, idx);
        }
    } else {
        this.selectedDragIdx  = idx;
    }
}
