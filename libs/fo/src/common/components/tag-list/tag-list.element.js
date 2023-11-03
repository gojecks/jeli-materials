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
        'minInputLength',
        'allowFreeText'
    ],
    events: ['onTagSelected:emitter', 'onTagSearch:emitter'],
    DI: ['changeDetector?']
})
export function FoTagListElement(changeDetector) {
    this.autoCompleteResult = [];
    this.searchData = null;
    this._selectedTags = [];
    this.onTagSelected = new EventEmitter();
    this.onTagSearch = new EventEmitter();
    this.hideTextBox = false;
    this.noMatchFound = false;
    this.maximumSearch = 5;
    this._minInputLength = 3;
    this.searchValue = '';
    this.allowFreeText = false;
    this.changeDetector = changeDetector;
    this.onAutoCompleteValueChange = new EventDebounce(500, false)
    Object.defineProperties(this,{
        selectedTags: {
            set: function(value) {
                this._selectedTags = value || [];
            },
            get: () => this._selectedTags
        },
        minInputLength: {
            set: value => this._minInputLength = value || 3,
            get: () => this._minInputLength
        }
    });
}

FoTagListElement.prototype.didInit = function() {
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

FoTagListElement.prototype.search = function(searchValue) {
    if(this.searchData){
        var results = [];
        for(var data of this.searchData){
            if(results.length === this.maximumSearch) break;
            if((data.name || data).toLowerCase().includes(searchValue.toLowerCase()) && !this._selectedTags.includes(data)){
                results.push(data);
            }
        }
        if (!results.length && this.allowFreeText){
            results.push(searchValue)
        }
        
        this.autoCompleteResult = results;
        this.changeDetector.onlySelf();
    }
}

FoTagListElement.prototype.onSelectOption = function(option) {
    this.autoCompleteResult = [];
    if (this._selectedTags.includes(option)) return;
    this._selectedTags.push(option);
    this.onTagSelected.emit(this._selectedTags);
    this.searchValue = '';
    this.hideTextBox = this.hideOnSelect;
}

FoTagListElement.prototype.removeTag = function(idx) {
    this._selectedTags.splice(idx, 1);
    this.onTagSelected.emit(this._selectedTags);
    if (!this._selectedTags.length) {
        this.hideTextBox = false;
    }
};

FoTagListElement.prototype.viewDidDestroy = function() {
    this.onTagSelected.destroy();
    this.onAutoCompleteValueChange.destroy();
    this.onTagSearch.destroy();
    this._selectedTags = [];
    this.searchData =  null;
    this.autoCompleteResult = null;
}