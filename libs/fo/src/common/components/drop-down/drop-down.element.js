import {AttributeAppender} from '@jeli/core';

Element({
    selector: 'fo-drop-down',
    templateUrl: './drop-down.element.html',
    styleUrl: './drop-down.element.scss',
    props: ["label", "buttonStyle", "position", "size", "color"],
    events: ['document.click:event=registerDocumentClick()'],
    viewChild: ['dropDown:HTMLElement=#dropDown'],
    DI: ['changeDetector?']
})
export function DropDownElement(changeDetector) {
    this.dropDown = null;
    this.changeDetector = changeDetector;
    this.isDropDownOpen = false;
    this.position = "start";
    this.size = "lg";
    this.color = "";
    this.dropDownMenuStyle = {};
}

DropDownElement.prototype.registerDocumentClick = function() {
    if (this.isDropDownOpen) {
        this.isDropDownOpen = false;
        this.dropDownMenuStyle = {};
        this.changeDetector.onlySelf();
    }
}

DropDownElement.prototype.onOptionSelected = function(ev) {
    this.isDropDownOpen = false;
}

DropDownElement.prototype.viewDidLoad = function() {
   
}

DropDownElement.prototype.calculateStyle = function(){
    if (this.dropDown) {
        var style = {};
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        var dropDownMenu = this.dropDown.querySelector('.dropdown-menu');
        var dropDownRect = dropDownMenu.getBoundingClientRect();
        var btnRect = this.dropDown.querySelector('button').getBoundingClientRect();
        if (this.position === 'end' || (windowWidth === (btnRect.left + btnRect.width) && dropDownRect.width > btnRect.width)) {
            style.right = 0;
        }

        if (dropDownRect.bottom > windowHeight) {
            style.bottom = btnRect.height;
        }
        
        AttributeAppender(dropDownMenu, {style});
    }
}

DropDownElement.prototype.openDropDown = function(event) {
    event.stopPropagation();
    this.isDropDownOpen = !this.isDropDownOpen;
    requestAnimationFrame(() => this.calculateStyle());
}