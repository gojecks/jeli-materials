Directive({
    selector:'foNormalizeURL',
    DI: ['HostElement?']
})
export function FoNormalizeURlDirective(hostElement){
    console.log(hostElement);
}