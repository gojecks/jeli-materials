import { TimeAgoService } from "./time-ago.service";

Element({
    selector: 'fo-time-ago',
    template: '<span>${timeago}</span>',
    props: ['time', 'interval'],
    DI: [TimeAgoService]
})
export class TimeAgoElement {
    constructor(timeAgoService) {
        this.timeago = "";
        this.interval = 1000;
        this.timerId = null;
        this.timeAgoService = timeAgoService;
    }

    refresh() {
        if(this.time){
            this.timeago = this.timeAgoService.get(this.time);
        }
    }

    didInit(){
        this.refresh();
        this.timerId = setInterval(() => this.refresh(), this.interval);   
    }

    viewDidDestroy(){
        clearInterval(this.timerId);
    }
}