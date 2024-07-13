import { CommonModule } from '@jeli/common';
import { FoModalElement } from './modal.element';
import { ModalService } from './modal.service';
import { modalRegistry } from './modal.registry';

jModule({
    requiredModules: [
        CommonModule
    ],
    services: [
        ModalService
    ],
    selectors: [
        FoModalElement
    ]
})
export class FoModalModule {
    static registerComponent(component){
        if (('function' == typeof component)) {
            modalRegistry.set(component.type, component);
        }
    }

    constructor(){}
}