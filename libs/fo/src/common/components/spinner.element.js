Element({
    selector:"fo-spinner",
    template: '<div attr-class="\'row m-0 spinner-wrapper \'+ customClass"><div class="col-12" attr-class="spinnerStyle" role="status"></div><div class="col-12"><strong>${loadingText}</strong>\
        </div></div><div class="modal-backdrop show in" *if="backDrop"></div>',
    style:['.spinner-wrapper{ z-index: 1075;position: fixed;top: 0;bottom: 0; width: 100%;align-content: center;align-items: center;justify-content: center;} .modal-backdrop{ z-index: 1071!important}'],
    props: ['spinnerStyle', 'loadingText', 'customClass', 'backDrop']
})
export function SpinnerElement(){
    this.spinnerStyle= 'spinner-border';
    this.loadingText = 'Loading...';
    this.customClass = 'text-center text-white';
    this.backDrop = true;
}

