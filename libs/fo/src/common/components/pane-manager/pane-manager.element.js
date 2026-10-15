import { AttributeAppender, EventEmitter } from '@jeli/core';

Element({
    selector: 'fo-pane-manager',
    templateUrl: './pane-manager.element.html',
    styleUrl: './pane-manager.element.scss',
    props: ['resizable:Boolean', 'gutterSize:Number', 'orientation'],
    events: [
        'mousemove:event=onGutterMove($event)',
        'mouseup:event=onGutterRelease($event)',
        'mouseleave:event=onGutterRelease($event)',
        'onResize:emitter'
    ],
    DI: ['HostElement?']
})
export class FoPaneManagerElement {
    constructor(hostElement) {
        this.hostElement = hostElement;
        this.resizable = true;
        this.gutterSize = 6;
        this.orientation = 'horizontal';
        this._panes = [];
        this._drag = null;
        this.onResize = new EventEmitter(false);
    }

    // :host{display:block} isn't reliable for the actual custom-element
    // host node here (confirmed for fo-pane-content, see its own comment) -
    // set it imperatively so the height:100% chain (.fo-pane-manager inner
    // div -> panes) has a real block-level box to resolve against.
    viewDidLoad() {
        if (this.hostElement) {
            // min-height mirrors the :host rule in the stylesheet - set imperatively too since
            // the scoping attribute that :host compiles to isn't guaranteed to land here (see
            // display above), and without it a collapsed host is invisible with nothing for the
            // consuming app's own drag/drop hit-testing to land on.
            AttributeAppender.setProp(this.hostElement.nativeElement, 'style', { display: 'block', minHeight: '24rem' });
        }
    }

    registerPane(pane) {
        this._panes.push(pane);
        // registration order (didInit/viewDidLoad call order for projected
        // content) isn't guaranteed to match light-DOM order, so re-derive
        // the real visual order from the DOM itself rather than trusting it.
        this._panes.sort((a, b) => {
            const position = a.hostElement.nativeElement.compareDocumentPosition(b.hostElement.nativeElement);
            return (position & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
        });
        this._panes.forEach((p, idx) => {
            const isLast = idx === this._panes.length - 1;
            if (p.isLast !== isLast) {
                p.isLast = isLast;
                if (p.changeDetector) p.changeDetector.onlySelf();
            }
        });
    }

    activateResize(ev, pane) {
        if (!this.resizable || !pane.resizable || !this.hostElement) return;
        const idx = this._panes.indexOf(pane);
        if (idx === -1 || idx === this._panes.length - 1) return;
        ev.preventDefault();

        const isVertical = this.orientation === 'vertical';
        const containerRect = this.hostElement.nativeElement.getBoundingClientRect();
        const leftRect = this._panes[idx].hostElement.nativeElement.getBoundingClientRect();
        const rightRect = this._panes[idx + 1].hostElement.nativeElement.getBoundingClientRect();
        const containerSize = isVertical ? containerRect.height : containerRect.width;

        this._drag = {
            idx,
            containerSize,
            startPos: isVertical ? ev.clientY : ev.clientX,
            leftSize: ((isVertical ? leftRect.height : leftRect.width) / containerSize) * 100,
            rightSize: ((isVertical ? rightRect.height : rightRect.width) / containerSize) * 100
        };
    }

    onGutterMove(ev) {
        if (!this._drag) return;
        ev.preventDefault();
        const drag = this._drag;
        const left = this._panes[drag.idx];
        const right = this._panes[drag.idx + 1];
        const pos = this.orientation === 'vertical' ? ev.clientY : ev.clientX;
        const deltaPercent = ((pos - drag.startPos) / drag.containerSize) * 100;

        let newLeft = drag.leftSize + deltaPercent;
        let newRight = drag.rightSize - deltaPercent;

        if (newLeft < left.minSize) {
            newRight -= (left.minSize - newLeft);
            newLeft = left.minSize;
        } else if (newRight < right.minSize) {
            newLeft -= (right.minSize - newRight);
            newRight = right.minSize;
        }

        if (newLeft < left.minSize || newLeft > left.maxSize || newRight < right.minSize || newRight > right.maxSize) {
            return;
        }

        left.size = +newLeft.toFixed(2);
        right.size = +newRight.toFixed(2);
        left.applySize();
        right.applySize();
    }

    onGutterRelease() {
        if (!this._drag) return;
        this._drag = null;
        this.onResize.emit(this._panes.map((pane) => ({ col: pane.col, size: pane.size })));
    }
}
