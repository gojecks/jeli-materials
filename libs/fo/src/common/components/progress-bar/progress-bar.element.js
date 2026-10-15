Element({
    templateUrl: "./progress-bar.element.html",
    props: ["value", "max", 'progressStyle', 'showLabel'],
    selector: 'fo-progress-bar'
})
export class ProgressBarElement {
    constructor() {
        this.progressStyle = 'warning';
        this.max = 100;
        this.percent = '';
        this.value = 10;
    }
    willObserve() {
        this.max = this.max || 100;
        this.percent = +(100 * this.value / this.max).toFixed(2);
    }
}

