import {AttributeAppender, EventEmitter} from '@jeli/core';
var dropDownCountIndex = 0;
// tracks the single fo-drop-down currently open across the page, so opening
// one closes any other that was left open (stopPropagation in openDropDown
// keeps that click from ever reaching the other instance's document listener)
var activeDropDown = null;

Element({
    selector: 'fo-drop-down',
    templateUrl: './drop-down.element.html',
    styleUrl: './drop-down.element.scss',
    props: [
        "label", 
        "buttonStyle", 
        "position", 
        "size", 
        "color", 
        'value', 
        'iconClass',
        'boundary'
    ],
    events: [
        'document.click:event=registerDocumentClick()',
        'window.resize:event=onWindowResize()',
        'window.scroll:event=onWindowScroll()',
        'click-delegate:a=onItemClicked($event.target.id)',
        'foDropDownChange:emitter'
    ],
    viewChild: ['dropDown:HTMLElement=#dropDown'],
    DI: ['changeDetector?'],
    asNative: {
        selector: 'fo-drop-down-native'
    }
})
export class DropDownElement {
    constructor(changeDetector) {
        this.dropDown = null;
        this.changeDetector = changeDetector;
        this.isDropDownOpen = false;
        this.iconClass = 'dropdown-toggle';
        this.position = "start";
        this.boundary = '';
        this.size = "lg";
        this.color = "";
        this.dropDownMenuStyle = {};
        this.value = null;
        this.dropDownItems = new Map();
        this.countIndex = 0;
        this.foDropDownChange = new EventEmitter();
    }
    setItem(dropDownItem) {
        this.dropDownItems.set(dropDownItem._id, dropDownItem);
        dropDownItem.setActive((this.value !== null && this.value == dropDownItem.value));
    }
    registerDocumentClick() {
        if (this.isDropDownOpen) {
            this.closeDropDown();
        }
    }
    onWindowResize() {
        if (this.isDropDownOpen) {
            this.calculateStyle();
        }
    }
    onWindowScroll() {
        if (this.isDropDownOpen) {
            this.calculateStyle();
        }
    }
    closeDropDown() {
        this.isDropDownOpen = false;
        this.dropDownMenuStyle = {};
        if (activeDropDown === this) {
            activeDropDown = null;
        }
        this.changeDetector.onlySelf();
    }
    onItemClicked(id) {
        var dropdownItem = this.dropDownItems.get(id);
        this.closeDropDown();
        if (dropdownItem) {
            this.setActive(dropdownItem._id);
            this.foDropDownChange.emit(dropdownItem.value);
        }
    }
    setActive(id) {
        this.dropDownItems.forEach(dropDownItem => {
            dropDownItem.setActive((id == dropDownItem._id));
        });
    }

    viewDidLoad() {
    }
    removeItem(radioItem) {
        this.dropDownItems.delete(radioItem._id);
        this.countIndex--;
        if (this.value == radioItem.value) {
            this.value = null;
        }
    }
    viewDidDestroy() {
        this.dropDownItems.clear();
        if (activeDropDown === this) {
            activeDropDown = null;
        }
    }
    calculateStyle() {
        if (this.dropDown) {
            const style = {};
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const dropDownMenu = this.dropDown.querySelector('.dropdown-menu');
            // clear any placement from a previous calculation (e.g. on window
            // resize) so the rect below reflects the menu's natural flow
            // position instead of compounding on top of the last placement
            dropDownMenu.style.cssText = '';
            const dropDownRect = dropDownMenu.getBoundingClientRect();
            const btnRect = this.dropDown.querySelector('button').getBoundingClientRect();
            const isEndPosition = (windowWidth === (btnRect.left + btnRect.width) && dropDownRect.width > btnRect.width);
            // attach the dropdown element to the body using fixed position
            // calculate the require position placement
            const flipUp = dropDownRect.bottom > windowHeight;
            if (this.boundary === 'viewport'){
                style.position = 'fixed';
                style.top = flipUp ? btnRect.top - dropDownRect.height : btnRect.bottom;
                if(this.position === 'end' || isEndPosition){
                    style.left = btnRect.right - dropDownRect.width;
                }
            } else if (this.position === 'end' || isEndPosition) {
                style.right = 0;
            }

            if (flipUp && this.boundary !== 'viewport') {
                style.bottom = btnRect.height;
            }

            AttributeAppender.set(dropDownMenu, { style });
        }
    }
    openDropDown(event) {
        event.stopPropagation();
        if (this.isDropDownOpen) {
            this.closeDropDown();
            return;
        }
        if (activeDropDown && activeDropDown !== this) {
            activeDropDown.closeDropDown();
        }
        activeDropDown = this;
        this.isDropDownOpen = true;
        requestAnimationFrame(() => this.calculateStyle());
    }
}


Element({
    selector: 'drop-down-item',
    DI: ['ContentHostRef?'],
    props: ['value', 'label', 'icon', 'id'],
    template:'<a class="dropdown-item" {class}="{active: isActive}" attr-id="_id"><i {class}="icon"></i> ${label}</a>'
})
export class DropDownItemElement {
    constructor(contentHostRef) {
        if (!contentHostRef instanceof DropDownElement) {
            throw new Error('<drop-down-item/> requires ConenentHostRef<fo-drop-down> in-order to function');
        }
        this.countIndex = contentHostRef.countIndex++;
        this.contentHostRef = contentHostRef;
        this.isActive = false;
        Object.defineProperty(this, '_id', {
            get: () => (this.id || 'drop_down_item_' + this.countIndex)
        });
    }
    didInit() {
        this.contentHostRef.setItem(this);
    }
    setActive(isSelected) {
        this.isActive = isSelected;
    }
    viewDidDestroy() {
        this.contentHostRef.removeItem(this);
        this.contentHostRef = null;
    }
}