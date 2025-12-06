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
        if (isNaN(Number(value))) return value;
        return sizeConversion(value);
    }
}