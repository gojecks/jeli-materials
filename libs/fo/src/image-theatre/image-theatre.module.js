import { CommonModule } from '@jeli/common';
import { ImageTheatreElement } from './image-theatre.element.js';
import { ImageTheatreService } from './image-theatre.service.js';

jModule({
    requiredModules: [
        CommonModule,

    ],
    selectors: [
        ImageTheatreElement,
    ],
    services: [
        ImageTheatreService
    ]
})
export function ImageTheatreModule() {}