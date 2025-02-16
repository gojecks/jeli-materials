import { TimeAgoService } from "./time-ago.service";

Element({
    selector: 'fo-time-ago',
    template: '<span>${timeago}</span>',
    props: [
        'time',
        'interval',
        'countDown'
    ],
    DI: [TimeAgoService, 'changeDetector?']
})
export class TimeAgoElement {
    constructor(timeAgoService, changeDetector) {
        this.changeDetector = changeDetector;
        this.timeago = "";
        this.interval = 1000;
        this.countDown = false;
        this.timerId = null;
        this.timeAgoService = timeAgoService;
        this.countDownTimer = {
            hours: 0,
            mins: 0,
            secs: 60
        };
    }

    refresh() {
        if (this.time) {
            if (this.countDown) {
                if (this.time < Date.now()) {
                    this.timeago = '00:00:00';
                    clearInterval(this.timerId);
                } else {
                    this.countDownTimer.secs--;
                    this.timeago = `${this.finePrint(this.countDownTimer.hours)} : ${this.finePrint(this.countDownTimer.mins)} : ${this.finePrint(this.countDownTimer.secs)}`;
                    if (!this.countDownTimer.secs) {
                        this.countDownTimer.secs = 60;
                        this.countDownTimer.mins--;
                        if (!this.countDownTimer.mins && this.countDownTimer.hours){
                            this.countDownTimer.mins = 60;
                            this.countDownTimer.hours--;
                        }
                    }
                }
            } else {
                this.timeago = this.timeAgoService.get(this.time);
            }

            this.changeDetector.onlySelf();
        }
    }

    didInit() {
        this.calculateTime();
        this.refresh();
        this.timerId = setInterval(() => this.refresh(), this.interval);
    }

    viewDidDestroy() {
        clearInterval(this.timerId);
    }

    finePrint(num){
        return ((num < 9 ? 0 : '') + num)
    }

    calculateTime() {
        if (this.countDown && this.time) {
            var minutes = Math.round(((this.time - new Date()) / 1000) / 60);
            if (minutes > 59) {
                this.countDownTimer.hours = ((minutes / 60) - 1);
                this.countDownTimer.mins = 60;
            } else {
                this.countDownTimer.mins = minutes;
            }
        }
    }
}