Service()
export function TimeAgoService() {
    this.settings = {
        refreshMillis: 60000,
        allowFuture: true,
        strings: {
            prefixAgo: null,
            prefixFromNow: null,
            suffixAgo: "ago",
            suffixFromNow: "from now",
            seconds: "less than a minute",
            minute: "about a minute",
            minutes: "%d minutes",
            hour: "about an hour",
            hours: "about %d hours",
            day: "a day",
            days: "%d days",
            month: "about a month",
            months: "%d months",
            year: "about a year",
            years: "%d years",
            wordSeparator: " ",
            numbers: []
        }
    };

    this.extendSettings = function(config) {
        Object.assign(this.settings, config);
    };
}

TimeAgoService.prototype.inWords = function(datetime) {
    datetime = (new Date().getTime() - datetime.getTime());
    var locale = this.settings.strings;
    var prefix = locale.prefixAgo;
    var suffix = locale.suffixAgo;
    if (this.settings.allowFuture) {
        if (datetime < 0) {
            prefix = locale.prefixFromNow;
            suffix = locale.suffixFromNow;
        }
    }

    var seconds = Math.abs(datetime) / 1000;
    var minutes = seconds / 60;
    var hours = minutes / 60;
    var days = hours / 24;
    var years = days / 365;

    function substitute(stringOrFunction, number) {
        var string = ('function' === typeof stringOrFunction) ? stringOrFunction(number, datetime) : stringOrFunction;
        var value = (locale.numbers && locale.numbers[number]) || number;
        return string.replace(/%d/i, value)
    }

    var words = (
        seconds < 45 && substitute(locale.seconds, Math.round(seconds)) ||
        seconds < 90 && substitute(locale.minute, 1) ||
        minutes < 45 && substitute(locale.minutes, Math.round(minutes)) ||
        minutes < 90 && substitute(locale.hour, 1) ||
        hours < 24 && substitute(locale.hours, Math.round(hours)) ||
        hours < 42 && substitute(locale.day, 1) ||
        days < 30 && substitute(locale.days, Math.round(days)) ||
        days < 45 && substitute(locale.month, 1) ||
        days < 365 && substitute(locale.months, Math.round(days / 30)) ||
        years < 1.5 && substitute(locale.year, 1) ||
        substitute(locale.years, Math.round(years))
    );

    var separator = locale.wordSeparator || "";
    if (locale.wordSeparator === undefined) {
        separator = " "
    }

    return [prefix, words, suffix].join(separator).trim();
};

TimeAgoService.prototype.parse = function(iso8601) {
    var s = iso8601.trim();
    s = s.replace(/\.\d+/, "");
    s = s.replace(/-/, "/").replace(/-/, "/");
    s = s.replace(/T/, " ").replace(/Z/, " UTC");
    s = s.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2");
    return new Date(s);
};

TimeAgoService.prototype.get = function(timestamp) {
    if (timestamp instanceof Date) {
        return this.inWords(timestamp)
    } else if (typeof timestamp === "string") {
        return this.inWords(this.parse(timestamp))
    } else if (typeof timestamp === "number") {
        return this.inWords(new Date(timestamp))
    } else {
        return this.inWords(new Date);
    }
}