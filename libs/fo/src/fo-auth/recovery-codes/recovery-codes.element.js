Element({
    selector: 'fo-recovery-codes',
    templateUrl: './recovery-codes.element.html',
    styleUrl: './recovery-codes.element.scss',
    DI: ['changeDetector?'],
    props: ['codes:Array']
})
export class FoRecoveryCodesElement {
    codes = [];
    constructor(changeDetector) {
        this.changeDetector = changeDetector;
        this.copied = false;
    }

    get text() {
        return (this.codes || []).join('\n');
    }

    copy() {
        navigator.clipboard.writeText(this.text).then(() => {
            this.copied = true;
            if (this.changeDetector) this.changeDetector.detectChanges();
        });
    }

    download() {
        const url = URL.createObjectURL(new Blob([this.text + '\n'], { type: 'text/plain' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'recovery-codes.txt';
        link.click();
        URL.revokeObjectURL(url);
    }
}
