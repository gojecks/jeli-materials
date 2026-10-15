import { parseText } from "../../../utils"

Element({
    selector: 'fo-header',
    templateUrl: './header.element.html',
    styleUrl: './header.element.scss',
    props: ['image','heroClass','heroTextClass','heading','subHeading']
})
export class FoHeaderElement {
    parseText = parseText;
    image = '';
    heroClass = '';
    heroTextClass = '';
    heading = '';
    subHeading = '';
    constructor() { }
}


