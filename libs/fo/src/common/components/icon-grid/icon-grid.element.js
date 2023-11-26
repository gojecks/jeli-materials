import {WebStateService} from '@jeli/router';
Element({
    selector: 'fo-icon-grid',
    templateUrl: './icon-grid.element.html',
    styleUrl: './icon-grid.element.scss',
    props: ['gridContents'],
    DI: [WebStateService]
})
export function IconGridElement(webStateService) {
    this.webStateService = webStateService;
    this.gridContents = {
        views: []
    };
}