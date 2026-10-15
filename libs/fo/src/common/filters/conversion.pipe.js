Pipe({
    name: "conversion"
})
export class ConversionPipe {
    constructor() {
        this.sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    }

    compile(value, type) {
        const sizeConversion = (size, c = 0) => {
            if (size > 1024)
                return sizeConversion(size / 1024, ++c);
            if (size == 1024 && c) {
                size = 1;
                c++;
            }
            
            const amt = (size || 0).toFixed(2).split('.');
            return `${amt[1].startsWith('0') ? amt[0] : amt.join('.')} ${type || this.sizes[c]}`;
        };

        const formatDuration = (seconds) => {
            if (seconds < 0.001) {
                return (seconds * 1000000).toFixed(2) + " μs"; // Microseconds
            } else if (seconds < 1) {
                return (seconds * 1000).toFixed(2) + " ms";   // Milliseconds
            } else if (seconds < 60) {
                return seconds.toFixed(2) + " sec";          // Seconds
            } else {
                return (seconds / 60).toFixed(2) + " min";   // Minutes
            }
        };
        
        const toNumber = Number(value);
        if (isNaN(toNumber)) return value;
        
        switch(type || '_'){
            case('seconds'): return formatDuration(value);
            case('number'):  return toNumber.toLocaleString();
            default: return sizeConversion(toNumber)
        }
    }
}
