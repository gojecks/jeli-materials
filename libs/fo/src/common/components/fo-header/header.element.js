import { parseText } from "../../../utils"

Element({
    selector: 'fo-header',
    templateUrl: './header.element.html',
    styleUrl: './header.element.scss',
    props: ['image','heroClass','heroTextClass','heading','subHeading']
})
export function FoHeaderElement() {
    this.parseText = parseText;
    this.image  = '';
    this.heroClass= '';
    this.heroTextClass = '';
    this.heading = '';
    this.subHeading = '';
}


