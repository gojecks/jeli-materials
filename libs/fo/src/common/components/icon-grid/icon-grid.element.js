import {EventEmitter} from '@jeli/core';
Element({
    selector: 'fo-icon-grid',
    templateUrl: './icon-grid.element.html',
    styleUrl: './icon-grid.element.scss',
    props: ['items', 'gridClass', 'colClass', 'colWrapperClass', 'iconContainerClass', 'headerClass'],
    events: ['onGridItemClicked:emitter']
})
export function IconGridElement() {
    this.items = []; 
    this.rowClass = '';
    this.colClass = ''; 
    this.colWrapperClass = '';
    this.iconContainerClass = '';
    this.headerClass = '';
    this.onGridItemClicked = new EventEmitter();
}