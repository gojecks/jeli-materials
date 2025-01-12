import { EventDebounce, rxUntilChanged, rxWhile,  EventEmitter } from '@jeli/core';
Element({
    selector: 'fo-tag-list',
    templateUrl: './tag-list.element.html',
    styleUrl: './tag-list.element.scss',
    props: [
        'selectedTags', 
        'autoCompleteResult', 
        'placeholder', 
        'hideOnSelect', 
        'searchData',
        'name',
        'minInputLength',
        'allowFreeText',
        'cbClass'
    ],
    events: [
        'onTagSelected:emitter', 
        'onTagSearch:emitter', 
        'onTagRemoved:emitter'
    ],
    DI: ['changeDetector?', 'ParentRef?=formControl']
})
export class FoTagListElement {
    constructor(changeDetector, parentFormControl) {
        this.parentFormControl = parentFormControl;
        this.fieldControl = null;
        this.autoCompleteResult = [];
        this.searchData = null;
        this.cbClass = '';
        this._selectedTags = [];
        this.onTagSelected = new EventEmitter();
        this.onTagSearch = new EventEmitter();
        this.onTagRemoved = new EventEmitter();
        this.hideTextBox = false;
        this.noMatchFound = false;
        this.maximumSearch = 5;
        this._minInputLength = 3;
        this.searchValue = '';
        this.allowFreeText = false;
        this.changeDetector = changeDetector;
        this.onAutoCompleteValueChange = new EventDebounce(500, false);
    }

    set selectedTags(value) {
        this._selectedTags = value || [];
    }
    
    get selectedTags(){
        return this._selectedTags;
    }

    set minInputLength(value){
        this._minInputLength = value || 3;
    }

    get minInputLength(){
        return this._minInputLength;
    }

    didInit() {
        this.setupControl();
        this.onAutoCompleteValueChange
            .when(rxUntilChanged(), rxWhile(searchValue => {
                var searchValue = searchValue.trim();
                if (!searchValue || searchValue.length < this._minInputLength) {
                    this.autoCompleteResult = [];
                    this.noMatchFound = false;
                    this.changeDetector.onlySelf();
                    return false;
                }
                return true;
            }))
            .subscribe(searchValue => {
                this.searchValue = searchValue.trim();
                this.search(this.searchValue);
                this.onTagSearch.emit(this.searchValue);
            });

        // hideTextBox by default if selectedTags
        this.hideTextBox = (this.hideOnSelect && !!this._selectedTags.length);
    }
    search(searchValue) {
        if (this.searchData) {
            var results = [];
            for (var data of this.searchData) {
                if (results.length === this.maximumSearch) break;
                if ((data.name || data).toLowerCase().includes(searchValue.toLowerCase()) && !this._selectedTags.includes(data)) {
                    results.push(data);
                }
            }

            if (!results.length && this.allowFreeText) {
                results.push(searchValue);
            }

            this.autoCompleteResult = results;
            this.changeDetector.onlySelf();
        }
    }

    onSelectOption(option) {
        this.autoCompleteResult = [];
        if (this._selectedTags.includes(option)) return;
        this._selectedTags.push(option);
        if (this.fieldControl)
            this.fieldControl.patchValue(this._selectedTags);
        this.onTagSelected.emit(this._selectedTags);
        this.searchValue = '';
        this.hideTextBox = this.hideOnSelect;
    }

    removeTag(idx) {
        var removed = this._selectedTags.splice(idx, 1);
        this.onTagRemoved.emit(removed);
        this.onTagSelected.emit(this._selectedTags);
        if (!this._selectedTags.length) {
            this.hideTextBox = false;
        }
    }
    viewDidDestroy() {
        this.onTagSelected.destroy();
        this.onAutoCompleteValueChange.destroy();
        this.onTagSearch.destroy();
        this._selectedTags = [];
        this.searchData = null;
        this.autoCompleteResult = null;
        this._unsubscribe && this._unsubscribe();
    }

    setupControl(){
        if (this.parentFormControl && this.name) {
            this.fieldControl = this.parentFormControl.getField(this.name);
            if (this.fieldControl) {
                this._selectedTags = this.fieldControl.value || [];
            }
        }
    }
}