Service()
export function FoModalService() {

}

FoModalService.prototype.openModal = function(modalOptions) {
    var options = Object.assign({
        data: null,
        backDrop: false,
        showHeader: false,
        position: 'center'
    }, modalOptions)
}