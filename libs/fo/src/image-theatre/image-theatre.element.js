import { ImageTheatreService } from "./image-theatre.service";

Element({
    selector: 'fo-image-theatre',
    templateUrl: './image-theatre.element.html',
    styleUrl: './image-theatre.element.scss',
    DI: [ImageTheatreService]
})
export function ImageTheatreElement(imageTheatreService) {
    this.openTheatre = false;
    this.zoomScale = 60;
    this.entryIndex = 0;
    imageTheatreService.startTheatreEvent.subscribe(eventObj => {
        if (eventObj && eventObj.files) {
            this.openTheatre = eventObj;
        }
    });
}

ImageTheatreElement.prototype.scale = function(scale) {
    if ((!scale && this.zoomScale === 60) || (this.zoomScale === 100 && scale)) return;
    if (scale) {
        this.zoomScale += 10;
    } else {
        this.zoomScale -= 10;
    }
}

ImageTheatreElement.prototype.prevNext = function(next) {
    if (next) {
        if (this.openTheatre.files.length - 1 > this.openTheatre.entry) {
            this.openTheatre.entry += 1;
        }
    } else if (this.openTheatre.entry > 0 && this.openTheatre.files.length > 1) {
        this.openTheatre.entry -= 1;
    }
}