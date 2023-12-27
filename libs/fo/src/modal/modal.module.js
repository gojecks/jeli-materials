import { CommonModule } from '@jeli/common';
import { FoModalElement } from './modal.element';
import { FoModalService } from './modal.service';

jModule({
    requiredModules: [
        CommonModule
    ],
    selectors: [
        FoModalElement
    ]
})
export function FoModalModule() {

}