import { ImageTheatreService } from "./image-theatre.service";

Element({
    selector: 'fo-image-theatre',
    templateUrl: './image-theatre.element.html',
    styleUrl: './image-theatre.element.scss',
    DI: [ImageTheatreService, 'changeDetector?', 'HostElement?'],
    props: ['photos', 'config', 'showGridList'],
    viewChild: ['imageEl:HTMLElement=#theatreImage'],
    events: [
        'window.keydown:event=onKeydown($event)',
        'window.mousemove:event=onMouseMove($event)',
        'window.mouseup:event=onMouseUp($event)'
    ]
})
export class ImageTheatreElement {
    static FIT_SCALE = 80;
    static MAX_SCALE = 200;
    static MIN_SCALE = 50;
    constructor(imageTheatreService, changeDetector, hostElement) {
        this.changeDetector = changeDetector;
        this.hostElement = hostElement;
        this.openTheatre = false;
        this.zoomScale = ImageTheatreElement.FIT_SCALE;
        this.suppressZoomTransition = false;
        this.panX = 0;
        this.panY = 0;
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

        this._unsubscribeTheatre = imageTheatreService.startTheatreEvent.subscribe(eventObj => {
            if (eventObj && eventObj.files) {
                this.start(eventObj);
            } else if (this.openTheatre) {
                this.closeTheatre();
            }
        });

        Object.defineProperties(this, {
            currentImageUrl: {
                get: () => {
                    var imgPath = this.photos && this.photos.files[this.entryIndex];
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
    viewDidDestroy() {
        if (this._unsubscribeTheatre) this._unsubscribeTheatre();
        if (this.openTheatre) this.closeTheatre();
    }
    start(eventObj) {
        this.imageLoading = true;
        this.openTheatre = Object.assign({ entry: 0 }, eventObj);
        this._lastFocused = document.activeElement;
        document.body.classList.add(this.bodyClassList);
        this._preloadAdjacent();
        this.play();
        if (this.hostElement) {
            requestAnimationFrame(() => {
                var closeBtn = this.hostElement.nativeElement.querySelector('#close');
                if (closeBtn) closeBtn.focus();
            });
        }
    }
    onKeydown(event) {
        if (!this.openTheatre) return;
        switch (event.key) {
            case 'Escape': this.closeTheatre(); break;
            case 'ArrowLeft': this.prevNext(false); break;
            case 'ArrowRight': this.prevNext(true); break;
            case '+': case '=': this.scale(1); break;
            case '-': this.scale(0); break;
            default: return;
        }
        event.preventDefault();
    }
    /**
     * touch: single finger either pans (when zoomed in) or swipes to the
     * next/prev image (at fit scale); two fingers pinch-zoom; a second tap
     * within 300ms/30px of the first toggles zoom, same as a desktop dblclick.
     */
    onTouchStart(event) {
        if (event.touches.length === 2) {
            this._touchStartX = null;
            this._pinchStartDistance = this._touchDistance(event.touches);
            this._pinchStartScale = this.zoomScale;
            this.suppressZoomTransition = true;
            return;
        }

        var touch = event.changedTouches[0];
        var now = Date.now();
        if (this._lastTap && (now - this._lastTap.time) < 300 &&
            Math.abs(touch.clientX - this._lastTap.x) < 30 && Math.abs(touch.clientY - this._lastTap.y) < 30) {
            this.toggleZoom();
            this._lastTap = null;
        } else {
            this._lastTap = { time: now, x: touch.clientX, y: touch.clientY };
        }

        if (this.isZoomed) {
            this._panStartX = touch.clientX - this.panX;
            this._panStartY = touch.clientY - this.panY;
        } else {
            this._touchStartX = touch.clientX;
        }
    }
    onTouchMove(event) {
        if (event.touches.length === 2 && this._pinchStartDistance) {
            event.preventDefault();
            var ratio = this._touchDistance(event.touches) / this._pinchStartDistance;
            this.zoomScale = this._clampScale(this._pinchStartScale * ratio);
            this._clampPan();
            return;
        }

        if (this._panStartX == null) return;
        event.preventDefault();
        this.panX = event.touches[0].clientX - this._panStartX;
        this.panY = event.touches[0].clientY - this._panStartY;
        this._clampPan();
    }
    onTouchEnd(event) {
        if (event.touches.length > 0) return; // wait for all fingers to lift
        this._pinchStartDistance = null;
        this._panStartX = null;
        this._panStartY = null;
        this.suppressZoomTransition = false;
        if (this._touchStartX == null || this.isZoomed) return;
        var deltaX = event.changedTouches[0].clientX - this._touchStartX;
        this._touchStartX = null;
        if (Math.abs(deltaX) < 50) return;
        this.prevNext(deltaX < 0);
    }
    _touchDistance(touches) {
        var dx = touches[0].clientX - touches[1].clientX;
        var dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * desktop: scroll wheel zooms in/out around the current center,
     * dblclick toggles between fit and 2x, mousedown+drag pans once zoomed
     */
    onWheel(event) {
        if (!this.openTheatre) return;
        event.preventDefault();
        this.suppressZoomTransition = true;
        clearTimeout(this._wheelEndTimeout);
        this._wheelEndTimeout = setTimeout(() => { this.suppressZoomTransition = false; }, 200);
        this.scale(event.deltaY < 0, 8);
    }
    onDoubleClick() {
        if (!this.openTheatre) return;
        this.toggleZoom();
    }
    onMouseDown(event) {
        if (!this.isZoomed) return;
        event.preventDefault();
        this._isDragging = true;
        this._dragStartX = event.clientX - this.panX;
        this._dragStartY = event.clientY - this.panY;
    }
    onMouseMove(event) {
        if (!this._isDragging) return;
        this.panX = event.clientX - this._dragStartX;
        this.panY = event.clientY - this._dragStartY;
        this._clampPan();
    }
    onMouseUp() {
        this._isDragging = false;
    }
    toggleZoom() {
        this.zoomScale = this.isZoomed ? ImageTheatreElement.FIT_SCALE : ImageTheatreElement.MAX_SCALE;
        this.panX = 0;
        this.panY = 0;
        this.stop();
    }
    get isZoomed() {
        return this.zoomScale > ImageTheatreElement.FIT_SCALE;
    }
    _preloadAdjacent() {
        if (!this.openTheatre || !this.openTheatre.files.length) return;
        var files = this.openTheatre.files;
        var total = files.length;
        [1, -1].forEach(offset => {
            var file = files[(this.openTheatre.entry + offset + total) % total];
            if (file) new Image().src = this.openTheatre.fileUrl + (file.name || file);
        });
    }
    scale(zoomIn, amount) {
        this.zoomScale = this._clampScale(this.zoomScale + (zoomIn ? 1 : -1) * (amount || 10));
        this._clampPan();
        this.stop();
    }
    _clampScale(value) {
        return Math.min(ImageTheatreElement.MAX_SCALE, Math.max(ImageTheatreElement.MIN_SCALE, value));
    }
    /**
     * keeps the pan offset from ever revealing empty space past the image
     * edge - bounds are half the overflow between the (untranslated) image
     * size and its container, since the image is centered before panning
     */
    _clampPan() {
        if (!this.imageEl) return;
        var container = this.imageEl.parentElement.getBoundingClientRect();
        var img = this.imageEl.getBoundingClientRect();
        var maxPanX = Math.max(0, (img.width - container.width) / 2);
        var maxPanY = Math.max(0, (img.height - container.height) / 2);
        this.panX = Math.min(maxPanX, Math.max(-maxPanX, this.panX));
        this.panY = Math.min(maxPanY, Math.max(-maxPanY, this.panY));
    }
    prevNext(next) {
        if (!this.openTheatre.files.length) return;
        this.imageLoading = true;
        this.errorLoadingImage = false;
        var totalImages = this.openTheatre.files.length - 1;
        // reset scale/pan for new image
        this.zoomScale = ImageTheatreElement.FIT_SCALE;
        this.panX = 0;
        this.panY = 0;
        if (next) {
            this.openTheatre.entry = ((totalImages == this.openTheatre.entry) ? 0 : ++this.openTheatre.entry);
        } else {
            this.openTheatre.entry = ((this.openTheatre.entry === 0) ? totalImages : --this.openTheatre.entry);
        }
        this._preloadAdjacent();
    }
    closeTheatre() {
        this.openTheatre = null;
        this.zoomScale = ImageTheatreElement.FIT_SCALE;
        this.suppressZoomTransition = false;
        clearTimeout(this._wheelEndTimeout);
        this.panX = 0;
        this.panY = 0;
        this.imageLoading = false;
        this.errorLoadingImage = false;
        this.stop();
        // enable body Overlay
        document.body.classList.remove(this.bodyClassList);
        if (this._lastFocused && this._lastFocused.focus) this._lastFocused.focus();
        this._lastFocused = null;
    }
    stop() {
        clearInterval(this.interval);
        this.isPlaying = false;
        this.progress = 0;
        this.interval = null;
    }
    play() {
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
    handleImageLoading(isLoaded) {
        this.imageLoading = false;
        this.errorLoadingImage = !isLoaded;
        if (!isLoaded) this.stop();
        else this.play();
    }
    startTheatre(idx, fromZoomIcon) {
        if (this._config.allowThumbNailPreview && !fromZoomIcon) {
            this.entryIndex = idx;
            return;
        }

        this.start(Object.assign({ entry: idx }, this.photos));
    }
    fullScreen() {
        if (!this.hostElement) return;
        var request = !this.isFullScreen
            ? this.hostElement.nativeElement.requestFullscreen()
            : document.exitFullscreen();
        Promise.resolve(request).then(() => {
            this.isFullScreen = !this.isFullScreen;
            this.changeDetector && this.changeDetector.onlySelf();
        }, () => { /* request blocked/rejected - leave state as-is */ });
    }
    theatreBtnAction(id) {
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
}










