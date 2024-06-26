Element({
    templateUrl: "./progress-bar.element.html",
    props: ["value", "max", 'progressStyle', 'showLabel'],
    selector: 'fo-progress-bar'
})
export function ProgressBarElement() {
    this.progressStyle = 'warning';
    this.max = 100;
    this.percent = '';
    this.value = 10;
}

ProgressBarElement.prototype.willObserve = function() {
    this.max = this.max || 100;
    this.percent = +(100 * this.value / this.max).toFixed(2);
}