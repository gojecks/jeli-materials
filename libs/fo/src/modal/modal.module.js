import { CommonModule } from '@jeli/common';
import { FoModalElement } from './modal.element';
import { ModalService } from './modal.service';

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
export function FoModalModule() {

}