import { ImageTheatreService } from "./image-theatre.service";

Element({
    selector: 'fo-image-theatre',
    templateUrl: './image-theatre.element.html',
    styleUrl: './image-theatre.element.scss',
    DI: [ImageTheatreService, 'changeDetector?', 'HostElement?'],
    props: ['photos', 'config', 'showGridList']
})
export function ImageTheatreElement(imageTheatreService, changeDetector, hostElement) {
    this.changeDetector = changeDetector;
    this.hostElement = hostElement;
    this.openTheatre = false;
    this.zoomScale = 80;
    this.entryIndex = 0;
    this.progress = 0;
    this.bodyClassList = 'overflow-hidden';
    this.errorLoadingImage = false;
    this.imageLoading = false;
    this.showGridList = false;
    this.isPlaying = false;
    this.interval = null;
    this.isFullScreen = false;
    this._config = {
        size: 'col',
        gridClass: null,
        imgClass: null,
        autoPlay: true,
        interval: 3000,
        allowThumbNailPreview: false
    };

    imageTheatreService.startTheatreEvent.subscribe(eventObj => {
        if (eventObj && eventObj.files) {
            this.start(eventObj);
        }
    });

    Object.defineProperties(this, {
        currentImageUrl: {
            get: () => {
                var imgPath = this.photos.files[this.entryIndex];
                if (!imgPath) return '';
                return `${this.photos.fileUrl}${imgPath.name || imgPath}`;
            }
        },
        'config': {
            get: () => this._config,
            set: value => Object.assign(this._config, value)
        }
    });
}

ImageTheatreElement.prototype.start = function (eventObj) {
    this.imageLoading = true;
    this.openTheatre = eventObj;
    document.body.classList.add(this.bodyClassList);
    this.play();
}

ImageTheatreElement.prototype.scale = function (scale) {
    if ((!scale && this.zoomScale === 80) || (this.zoomScale === 100 && scale)) return;
    if (scale) {
        this.zoomScale += 10;
    } else {
        this.zoomScale -= 10;
    }

    this.stop();
}

ImageTheatreElement.prototype.prevNext = function (next) {
    this.imageLoading = true;
    this.errorLoadingImage = false;
    var totalImages = this.openTheatre.files.length - 1;
    // reset scale for new image 
    this.zoomScale = 80;
    if (next) {
        this.openTheatre.entry = ((totalImages == this.openTheatre.entry) ? 0 : ++this.openTheatre.entry);
    } else {
        this.openTheatre.entry = ((this.openTheatre.entry === 0) ? totalImages : --this.openTheatre.entry);
    }
}

ImageTheatreElement.prototype.closeTheatre = function () {
    this.openTheatre = null;
    this.zoomScale = 80;
    this.imageLoading = false;
    this.errorLoadingImage = false;
    this.stop();
    // enable body Overlay
    document.body.classList.remove(this.bodyClassList);
}

ImageTheatreElement.prototype.stop = function () {
    if (!this._config.autoPlay) return;
    clearInterval(this.interval);
    this.isPlaying = false;
    this.progress = 0;
    this.interval = null;
}

ImageTheatreElement.prototype.play = function () {
    if (!this._config.autoPlay || this.interval) return;
    this.isPlaying = true;
    var interVal = this._config.interval || 5000;
    var progressInc = (100 / (interVal / 100));
    this.interval = setInterval(() => {
        // wait until image is loaded before start progressing
        if (this.imageLoading) return;

        if (this.progress >= 100) {
            this.prevNext();
            this.progress = 0;
        } else {
            this.progress += progressInc;
        }
        this.changeDetector.onlySelf();
    }, 100);
}

ImageTheatreElement.prototype.handleImageLoading = function (isLoaded) {
    this.imageLoading = false;
    this.errorLoadingImage = !isLoaded;
    if (!isLoaded) this.stop();
    else this.play();
}

ImageTheatreElement.prototype.startTheatre = function (idx, fromZoomIcon) {
    if (this._config.allowThumbNailPreview && !fromZoomIcon) {
        this.entryIndex = idx;
        return;
    }

    this.start(Object.assign({ entry: idx }, this.photos));
}

ImageTheatreElement.prototype.fullScreen = function () {
    if (!this.isFullScreen) {
        this.hostElement.nativeElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
    this.isFullScreen = !this.isFullScreen;
}

ImageTheatreElement.prototype.theatreBtnAction = function (id) {
    var actions = {
        'zoom-in': () => this.scale(1),
        'zoom-out': () => this.scale(0),
        close: () => this.closeTheatre(),
        playPause: () => {
            if (this.isPlaying)
                this.stop();
            else
                this.play();
        }, fscrn: () => this.fullScreen()
    };

    actions[id]();
}