import {AttributeAppender, EventEmitter} from '@jeli/core';
var dropDownCountIndex = 0;

Element({
    selector: 'fo-drop-down',
    templateUrl: './drop-down.element.html',
    styleUrl: './drop-down.element.scss',
    props: ["label", "buttonStyle", "position", "size", "color", 'value', 'iconClass'],
    events: [
        'document.click:event=registerDocumentClick()',
        'click-delegate:a=onItemClicked($event.target.id)',
        'foDropDownChange:emitter'
    ],
    viewChild: ['dropDown:HTMLElement=#dropDown'],
    DI: ['changeDetector?']
})
export function DropDownElement(changeDetector) {
    this.dropDown = null;
    this.changeDetector = changeDetector;
    this.isDropDownOpen = false;
    this.iconClass = 'dropdown-toggle'
    this.position = "start";
    this.size = "lg";
    this.color = "";
    this.dropDownMenuStyle = {};
    this.value = null;
    this.dropDownItems = new Map();
    this.countIndex = 0;
    this.foDropDownChange = new EventEmitter();
}

DropDownElement.prototype.setItem = function(dropDownItem){
    this.dropDownItems.set(dropDownItem._id, dropDownItem);
    dropDownItem.setActive((this.value !== null && this.value == dropDownItem.value));
}

DropDownElement.prototype.registerDocumentClick = function() {
    if (this.isDropDownOpen) {
        this.isDropDownOpen = false;
        this.dropDownMenuStyle = {};
        this.changeDetector.onlySelf();
    }
}

DropDownElement.prototype.onItemClicked = function(id){
    var dropdownItem = this.dropDownItems.get(id);
    if (dropdownItem){
        this.setActive(dropdownItem._id);
        this.foDropDownChange.emit(dropdownItem.value)
    }
}

DropDownElement.prototype.setActive = function(id) {
    this.dropDownItems.forEach(dropDownItem => {
        dropDownItem.setActive((id == dropDownItem._id));
    });
}

DropDownElement.prototype.onOptionSelected = function(ev) {
    this.isDropDownOpen = false;
}

DropDownElement.prototype.viewDidLoad = function() {
   
}

DropDownElement.prototype.removeItem = function(radioItem){
    this.dropDownItems.delete(radioItem._id);
    this.countIndex--;
    if (this.value == radioItem.value){
        this.value = null;
    }
}

DropDownElement.prototype.viewDidDestroy = function(){
    this.dropDownItems.clear();
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

Element({
    selector: 'drop-down-item',
    DI: ['ContentHostRef?'],
    props: ['value', 'label', 'icon', 'id'],
    template:'<a class="dropdown-item" {class}="{active: isActive}" attr-id="_id"><i {class}="icon"></i> ${label}</a>'
})
export function DropDownItemElement(contentHostRef){
    if (!contentHostRef instanceof DropDownElement){
        throw new Error('<drop-down-item/> requires ConenentHostRef<fo-drop-down> in-order to function')
    }
    this.countIndex = contentHostRef.countIndex++;
    this.contentHostRef = contentHostRef;
    this.isActive = false;
    Object.defineProperty(this, '_id', {
        get: () => (this.id || 'drop_down_item_'+ this.countIndex)
    });
}

DropDownItemElement.prototype.didInit = function(){
    this.contentHostRef.setItem(this);
}

DropDownItemElement.prototype.setActive = function(isSelected){
    this.isActive = isSelected;
}

DropDownItemElement.prototype.viewDidDestroy = function(){
    this.contentHostRef.removeItem(this);
    this.contentHostRef = null;
}