Element({
    selector: 'fo-mini-loading',
    template: '<span class="spinner-border spinner-border-sm ${klass}" role="status" aria-hidden="true" *if="showLoading"></span> ${text}',
    props: ["text", "showLoading", "klass"]
})
export function FoMiniLoadingElement() {}