import { CommonModule } from '@jeli/common';
import { FormModule } from '@jeli/form';
import { FoAccordionElement } from './accordion/accordion.element';
import { ButterBarElement } from './butter-bar/butter-bar.element';
import { CheckBoxElement } from './check-box/check-box.element';
import { DatePickerElement } from './date-picker/date-picker.element';
import { FoAceEditorDirective } from './directives/fo-ace-editor.directive';
import { DropDownElement } from './drop-down/drop-down.element';
import { FoAlertElement } from './fo-alert/fo-alert.element';
import { FoCarouselElement } from './fo-carousel/fo-carousel.element';
import { FoTreeElement } from './fo-tree/fo-tree-element';
import { FoMiniLoadingElement } from './miniloading';
import { OffCanvasElement } from './off-canvas/off-canvas.element';
import { PricingCardElement } from './pricing-card/pricing-card.element';
import { ProgressBarElement } from './progress-bar/progress-bar.element';
import { RadioButtonElement, RadioItemElement } from './radio-button/radio-button.element';
import { TimeAgoElement } from './time-ago/time-ago.element';
import { IconGridElement } from './icon-grid/icon-grid.element';
import { RatingElement } from './rating/rating.element';
import { FoHeaderElement } from './fo-header/header.element';
import { SpinnerElement } from './spinner.element';
import { FoTagListElement } from './tag-list/tag-list.element';


jModule({
    requiredModules: [
        CommonModule,
        FormModule
    ],
    selectors: [
        DatePickerElement,
        CheckBoxElement,
        RadioButtonElement,
        RadioItemElement,
        DropDownElement,
        FoTreeElement,
        ProgressBarElement,
        FoMiniLoadingElement,
        ButterBarElement,
        TimeAgoElement,
        PricingCardElement,
        FoAlertElement,
        FoCarouselElement,
        FoAceEditorDirective,
        FoAccordionElement,
        OffCanvasElement,
        IconGridElement,
        RatingElement,
        FoHeaderElement,
        SpinnerElement,
        FoTagListElement
    ]
})
export function FoCommonModule() {}