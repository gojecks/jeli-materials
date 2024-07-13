import { SliderAbstract } from "../../services/slider"

Element({
    selector: 'fo-slider',
    props: ['interval:Number', 'slidesPerView:Number','hiddenClass:Boolean','breakPoints:Array'],
    DI: ['HostElement?'],
    asNative: true
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

    didInit(){
        this.init();
    }

    viewDidDestroy(){
        this.destroy();
    }
}