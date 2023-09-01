import { EventEmitter } from '@jeli/core';

Element({
    selector: 'fo-modal',
    templateUrl: './modal.element.html',
    styleUrl: './modal.element.scss',
    props: ["backDrop", "backDropClose", "modalStyle", "hideHeader", 'displayType'],
    events: [
        "onModalClosed:emitter"
    ]
})
export function FoModalElement() {
    this.onModalClosed = new EventEmitter();
    this.backDrop = true;
    this.modalStyle = "";
    this.backDropClose = true;
    this.hideHeader = false;
    this.displayType = 'flex';
}

FoModalElement.prototype.closeModal = function(fromBackDrop) {
    if (fromBackDrop && !this.backDropClose) {
        return false;
    }

    this.onModalClosed.emit(true);
};