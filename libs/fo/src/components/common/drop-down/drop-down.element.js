import { ElementStyle } from '@jeli/core';
Element({
    selector: 'fo-drop-down',
    templateUrl: './drop-down.element.html',
    styleUrl: './drop-down.element.scss',
    props: ["label", "buttonStyle", "position", "size", "color"],
    events: ['document.click:event=registerDocumentClick()'],
    DI: ['ElementRef?', 'changeDetector?']
})
export function DropDownElement(elementRef, changeDetector) {
    this.element = elementRef;
    this.changeDetector = changeDetector;
    this.isDropDownOpen = false;
    this.position = "start";
    this.size = "lg";
    this.color = ""
}

DropDownElement.prototype.registerDocumentClick = function() {
    if (this.isDropDownOpen) {
        this.isDropDownOpen = false;
        this.changeDetector.onlySelf();
    }
}

DropDownElement.prototype.onOptionSelected = function(ev) {
    this.isDropDownOpen = false;
}

DropDownElement.prototype.viewDidLoad = function() {
    var dropDown = this.element.nativeElement.querySelector('.dropdown');
    var style = {};
    if (dropDown) {
        var windowWidth = window.innerWidth;
        var dropDownMenu = dropDown.querySelector('.dropdown-menu');
        var dropDownRect = dropDownMenu.getBoundingClientRect();
        var btnRect = dropDown.querySelector('button').getBoundingClientRect();
        if (this.position === 'end' || (windowWidth === (btnRect.left + btnRect.width) && dropDownRect.width > btnRect.width)) {
            style = { right: '0px' }
        }

        ElementStyle(dropDownMenu, style);
    }
}

DropDownElement.prototype.openDropDown = function(event) {
    event.stopPropagation();
    this.isDropDownOpen = !this.isDropDownOpen;
}