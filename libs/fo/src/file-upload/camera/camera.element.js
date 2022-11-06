import { EventEmitter } from '@jeli/core';

Element({
    selector: 'fo-camera',
    templateUrl: './camera.element.html',
    styleUrl: './camera.element.scss',
    events: [
        "onCameraAction:emitter"
    ],
    viewChild: [
        "videoContainer:ElementRef=videoPlayer",
        "canvasContainer:ElementRef=canvasContainer",
        "cameraContainer:ElementRef=cameraContainer"
    ],
    props: ['settings']
})
export function CameraElement() {
    this.onCameraAction = new EventEmitter();
    this.isCaptured = false;
    this._settingSet = false;
    this._settings = {
        width: 320,
        height: 320
    };

    Object.defineProperty(this, 'settings', {
        set: function(value) {
            if (typeof value === 'object' && !this._settingSet) {
                this._settingSet = true;
                Object.assign(this._settings, value);
            }
        }
    });
}

CameraElement.prototype.viewDidLoad = function() {
    var _this = this;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            _this.videoContainer.nativeElement.srcObject = stream;
            _this.videoContainer.nativeElement.play();
        })
        .catch(function() {
            _this.cameraError = 'Unable to start camera.';
        });
}

CameraElement.prototype.listenToPlay = function(ev) {
    var videoContainer = ev.target;
    if (!this.streaming) {
        this._settings.height = videoContainer.videoHeight / (videoContainer.videoWidth / this._settings.width);
        if (isNaN(this._settings.height)) {
            this._settings.height = this._settings.width / (4 / 3);
        }
        videoContainer.setAttribute('width', this._settings.width);
        videoContainer.setAttribute('height', this._settings.height);
        this.canvasContainer.nativeElement.setAttribute('width', this._settings.width);
        this.canvasContainer.nativeElement.setAttribute('height', this._settings.height);
        this._settings.marginTop = (window.innerHeight - this._settings.height) / 2;
        this.streaming = true;
    }
};

CameraElement.prototype.takePicture = function() {
    var canvas = this.canvasContainer.nativeElement;
    var context = canvas.getContext('2d');
    if (this._settings.width && this._settings.height) {
        canvas.width = this._settings.width;
        canvas.height = this._settings.height;
        context.drawImage(this.videoContainer.nativeElement, 0, 0, this._settings.width, this._settings.height);
        this.isCaptured = true;
    } else {
        this.clearphoto();
    }
}

CameraElement.prototype.clearphoto = function() {
    var canvas = this.canvasContainer.nativeElement;
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);
};

CameraElement.prototype.usePhoto = function() {
    var canvas = this.canvasContainer.nativeElement;
    var content = canvas.toDataURL('image/png');
    this.onCameraAction.emit({
        name: 'camera-photo',
        content: content
    });
};

CameraElement.prototype.viewDidDestroy = function() {
    this.videoContainer.nativeElement
        .srcObject
        .getVideoTracks()
        .forEach(function(track) { track.stop() });
    this.videoContainer = null;
    this.canvasContainer = null;
}