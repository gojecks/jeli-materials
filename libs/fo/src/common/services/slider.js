import { registerQueryEvent } from "./breakpoints";

/**
 * 
 * @param {*} sliderContainer 
 * @param {*} config 
 * @returns 
 */
export class SliderAbstract {

    constructor (){
        this.interval = 500;
        this.slidesPerView = 1;
        this.hiddenClass = 'd-none';
        this.end = 3
        this.start = 0;
        this.breakPoints =  {};
        this.intervalId = null;
    }

    get totalItems() {
        return this.sliderContainer.children.length;
    }

    getSlide(idx) {
        return this.sliderContainer.children[idx];
    }

    hideOrShowSlides(i, end){
        for (; i < end; i++) {
          this._toggle(i);
        }
    }

    init() {
        this.breakPointSubscription = registerQueryEvent(this.breakPoints, newValue => {
            if (this.slidesPerView != newValue) {
                var diff = 0;
                // hide items from visible slides
                // this will cause start to move ++
                if (this.slidesPerView > newValue) {
                  diff = (this.end - (this.slidesPerView - newValue));
                  this.hideOrShowSlides(diff, this.end);
                } else { 
                  // show more items from hidden slides
                  // this will cause end to ++ and start remains same
                  diff = (this.end + (newValue - this.slidesPerView));
                  this.hideOrShowSlides(this.end, diff);
                } 
                this.end = diff;
              }
              this.slidesPerView = newValue;
        });

        var _mainInitProcess = () => {
            this.hideOrShowSlides(this.end, this.totalItems);
            this.intervalId = setInterval(() => {
                if (this.end == this.totalItems) 
                    this.end = 0;
                else if (this.start == this.totalItems)
                    this.start = 0;
        
                this.nextSlides();
            }, Number(this.interval || 10000));
        };
    
         // initial hidden slides
        this.end = this.slidesPerView;
        if(!this.totalItems.length) {
            var checkForElements = setInterval(() => {
                if(this.sliderContainer.children.length){
                    clearInterval(checkForElements);
                    _mainInitProcess();
                }
            }, 100);
        } else {
            _mainInitProcess()
        }
    }

    nextSlides(){
        // slide element
        this._toggle(this.start);
        this._toggle(this.end);
       // increment start and end
       this.start++;
       this.end++;
    };


    destroy(){
        clearInterval(this.intervalId);
        this.breakPointSubscription();
    }

    _toggle(idx) {
        var item = this.getSlide(idx);
        if (item) item.classList.toggle(this.hiddenClass || 'd-none')
    }
}