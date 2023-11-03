Element({
    selector: 'fo-butter-bar',
    templateUrl: './butter-bar.element.html',
    styleUrl: './butter-bar.element.scss',
    props: ['active']
})
export function ButterBarElement() {
    this.active = false;
}