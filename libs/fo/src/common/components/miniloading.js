Element({
    selector: 'fo-mini-loading',
    template: '<span class="spinner-${type} spinner-${type}-${size} ${klass}" role="status" aria-hidden="true" *if="showLoading"></span> ${text}',
    props: ["text", "showLoading", "klass", 'size', 'type']
})
export function FoMiniLoadingElement() {
    this.type = 'border';
    this.size = 'sm';
    this.showLoading=true;
    this.klass='text-secondary';
    this.text = '';
}