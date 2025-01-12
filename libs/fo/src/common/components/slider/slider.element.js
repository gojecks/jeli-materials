import { SliderAbstract } from "../../services/slider"

Element({
    selector: 'fo-slider-native',
    template: '<j-place/>',
    props: ['interval:Number', 'slidesPerView:Number','hiddenClass:Boolean','breakPoints:Array'],
    DI: ['HostElement?'],
    asNative: {
        selector: 'fo-slider'
    }
})
export class FoSliderElement extends SliderAbstract{
    constructor(hostElement) {
        super();
        this.hostElement = hostElement;
    }

    get sliderContainer() {
        if (this.hostElement)
            return this.hostElement.nativeElement;
        else
            return this;
    }

    viewDidLoad(){
        this.init();
    }

    viewDidDestroy(){
        this.destroy();
    }
}