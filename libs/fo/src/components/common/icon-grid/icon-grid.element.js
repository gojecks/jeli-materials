Element({
    selector: 'fo-icon-grid',
    templateUrl: './icon-grid.element.html',
    styleUrl: './icon-grid.element.scss',
    props: ['gridContents']
})
export function IconGridElement() {
    this.gridContents = [];
}