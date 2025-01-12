import { EventEmitter } from '@jeli/core';
import { convert2Number } from '../../utils';

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
    props: ['settings', 'fullScreen']
})
export class CameraElement {
    constructor() {
        this.onCameraAction = new EventEmitter();
        this.isCaptured = false;
        this._settingSet = false;
        this.fullScreen = false;
        this._settings = {
            style:{
                width: 320,
                height: 320
            },
            constraint: {
                audio: false,
                video: {
                    facingMode: "user"
                }
            }
        };
    }

    set settings(value){
        if (typeof value === 'object' && !this._settingSet) {
            this._settingSet = true;
            if (!value.style){
                value = {style: value};
            }

            value.style.width = convert2Number(value.style.width,  'w');
            value.style.height = convert2Number(value.style.height,  'h');
            Object.assign(this._settings, value);
            // set the video dimension
            if (!this._settings.constraint.video.width){
                this._settings.constraint.video.height = value.style.height;
                this._settings.constraint.video.width = value.style.width;
            }
        }
    }

    get settings(){
        return this._settings;
    }

    viewDidLoad() {
        navigator.mediaDevices.getUserMedia(this._settings.constraint)
            .then((stream) => {
                this.videoContainer.nativeElement.srcObject = stream;
                this.videoContainer.nativeElement.play();
            })
            .catch(() => {
                this.cameraError = 'Unable to start camera.';
            });
    }
    listenToPlay(ev) {
        if (!this.streaming) {
            var videoContainer = ev.target;
            this._settings.style.height = videoContainer.videoHeight / (videoContainer.videoWidth / this._settings.style.width);
            if (isNaN(this._settings.style.height)) {
                this._settings.style.height = this._settings.style.width / (4 / 3);
            }

            this._settings.style.marginTop = (window.innerHeight - this._settings.style.height) / 2;
            videoContainer.setAttribute('width', this._settings.style.width);
            videoContainer.setAttribute('height', this._settings.style.height);
            this.canvasContainer.nativeElement.setAttribute('width', this._settings.style.width);
            this.canvasContainer.nativeElement.setAttribute('height', this._settings.style.height);
            this.streaming = true;
        }
    }
    takePicture() {
        var canvas = this.canvasContainer.nativeElement;
        var context = canvas.getContext('2d');
        if (this._settings.style.width && this._settings.style.height) {
            canvas.width = this._settings.style.width;
            canvas.height = this._settings.style.height;
            context.drawImage(this.videoContainer.nativeElement, 0, 0, this._settings.style.width, this._settings.style.height);
            this.isCaptured = true;
        } else {
            this.clearphoto();
        }
    }
    clearphoto() {
        var canvas = this.canvasContainer.nativeElement;
        var context = canvas.getContext('2d');
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    usePhoto() {
        var canvas = this.canvasContainer.nativeElement;
        var content = canvas.toDataURL('image/png');
        this.onCameraAction.emit({
            name: 'camera-photo',
            content: content
        });
    }
    viewDidDestroy() {
        this.videoContainer.nativeElement
            .srcObject
            .getVideoTracks()
            .forEach(function (track) { track.stop(); });
        this.videoContainer = null;
        this.canvasContainer = null;
    }
}