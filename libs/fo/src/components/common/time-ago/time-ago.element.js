import { TimeAgoService } from "./time-ago.service";

Element({
    selector: 'fo-time-ago',
    template: '<span>${timeago}</span>',
    props: ['time'],
    DI: [TimeAgoService]
})
export function TimeAgoElement(timeAgoService) {
    this._dateTime = NaN;
    this.timeago = "";

    this.refresh = function() {
        if (!isNaN(this._dateTime)) {
            this.timeago = timeAgoService.get(this._dateTime);
        }
    };

    this.didInit = function() {
        this.refresh();
        var _this = this;
        if (timeAgoService.settings.refreshMillis > 0) {
            setInterval(function() {
                _this.refresh();
            }, timeAgoService.settings.refreshMillis);
        }
    };

    Object.defineProperty(this, 'time', {
        set: function(value) {
            this._dateTime = timeAgoService.parse(value);
        }
    });
}