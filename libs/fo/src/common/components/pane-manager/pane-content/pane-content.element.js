import { AttributeAppender } from '@jeli/core';
import { FoPaneManagerElement } from '../pane-manager.element';

Element({
    selector: 'fo-pane-content',
    templateUrl: './pane-content.element.html',
    styleUrl: './pane-content.element.scss',
    props: ['col', 'size:Number', 'minSize:Number', 'maxSize:Number', 'resizable:Boolean'],
    DI: ['ContentHostRef?', 'HostElement?', 'changeDetector?']
})
export class FoPaneContentElement {
    constructor(manager, hostElement, changeDetector) {
        if (!(manager instanceof FoPaneManagerElement)) {
            throw new Error('<fo-pane-content/> requires a <fo-pane-manager/> ContentHostRef in-order to function');
        }
        this.manager = manager;
        this.hostElement = hostElement;
        this.changeDetector = changeDetector;
        this.minSize = 5;
        this.maxSize = 95;
        this.resizable = true;
        this.isLast = true;
    }

    viewDidLoad() {
        // registerPane needs a real, mounted DOM node (compareDocumentPosition),
        // so this must happen after mount, not in didInit().
        this.manager.registerPane(this);
        this.applySize();
    }

    // :host{} rules don't reliably apply to the actual custom-element host
    // node here (confirmed via devtools: the gutter div rendered 6x0, i.e.
    // laid out as a plain block box, not a flex row) - matches the rest of
    // this codebase never relying on :host for host-element layout. So the
    // host's own flex participation in fo-pane-manager's row is set
    // imperatively instead of via CSS, for both the fixed-size and
    // auto-grow (no explicit size) cases.
    applySize() {
        AttributeAppender.setProp(this.hostElement.nativeElement, 'style', this.size != null ? {
            flexBasis: this.size + '%',
            flexGrow: 0,
            flexShrink: 0
        } : {
            flexBasis: 'auto',
            flexGrow: 1,
            flexShrink: 1
        });
    }

    onGutterActivate(ev) {
        this.manager.activateResize(ev, this);
    }
}
