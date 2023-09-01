import { ImageTheatreService } from "./image-theatre.service";

Element({
    selector: 'fo-image-theatre',
    templateUrl: './image-theatre.element.html',
    styleUrl: './image-theatre.element.scss',
    DI: [ImageTheatreService],
    props: ['photos', 'config', 'showGridList']
})
export function ImageTheatreElement(imageTheatreService) {
    this.openTheatre = false;
    this.zoomScale = 60;
    this.entryIndex = 0;
    this.bodyClassList = 'overflow-hidden';
    this.errorLoadingImage = false;
    this.imageLoading = false;
    this.showGridList = false;
    this._config =  {
        size: 'col',
        gridClass: null,
        imgClass: null
    };

    imageTheatreService.startTheatreEvent.subscribe(eventObj => {
        if (eventObj && eventObj.files) {
            this.start(eventObj);
        }
    });

    Object.defineProperty(this, 'config', {
        get: () =>  this._config,
        set:  value => Object.assign(this._config, value)
    });
}

ImageTheatreElement.prototype.start = function(eventObj) {
    this.imageLoading = true;
    this.openTheatre = eventObj;
    document.body.classList.add(this.bodyClassList);
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
    this.imageLoading = true;
    this.errorLoadingImage = false;
    var totalImages = this.openTheatre.files.length - 1;
    // reset scale for new image 
    this.zoomScale = 60;
    if (next) {
        this.openTheatre.entry = ((totalImages == this.openTheatre.entry) ? 0 : ++this.openTheatre.entry);
    } else  {
        this.openTheatre.entry = ((this.openTheatre.entry === 0) ? totalImages : --this.openTheatre.entry);
    }
}

ImageTheatreElement.prototype.closeTheatre = function(){
    this.openTheatre = null;
    this.zoomScale = 60;
    this.imageLoading = false;
    this.errorLoadingImage = false;
    // enable body Overlay
    document.body.classList.remove(this.bodyClassList);
}


ImageTheatreElement.prototype.handleImageLoad = function(target) {
    
}

ImageTheatreElement.prototype.openTheatre = function(idx) {
   this.start(Object.assign({ entry: idx }, this.photos));
}