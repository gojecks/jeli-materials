import { CommonModule } from '@jeli/common';
import { FormModule } from '@jeli/form';
import {RouterModule} from '@jeli/router';
import { FoAccordionElement } from './components/accordion/accordion.element';
import { ButterBarElement } from './components/butter-bar/butter-bar.element';
import { CheckBoxElement } from './components/check-box/check-box.element';
import { DatePickerElement } from './components/date-picker/date-picker.element';
import { FoAceEditorDirective } from './directives/fo-ace-editor.directive';
import { DropDownElement, DropDownItemElement } from './components/drop-down/drop-down.element';
import { FoAlertElement } from './components/fo-alert/fo-alert.element';
import { FoCarouselElement } from './components/fo-carousel/fo-carousel.element';
import { FoTreeElement } from './components/fo-tree/fo-tree-element';
import { FoMiniLoadingElement } from './components/miniloading';
import { OffCanvasElement } from './components/off-canvas/off-canvas.element';
import { FoPaneManagerElement } from './components/pane-manager/pane-manager.element';
import { PricingCardElement } from './components/pricing-card/pricing-card.element';
import { ProgressBarElement } from './components/progress-bar/progress-bar.element';
import { RadioButtonElement, RadioItemElement } from './components/radio-button/radio-button.element';
import { TimeAgoElement } from './components/time-ago/time-ago.element';
import { IconGridElement } from './components/icon-grid/icon-grid.element';
import { RatingElement } from './components/rating/rating.element';
import { FoHeaderElement } from './components/fo-header/header.element';
import { SpinnerElement } from './components/spinner.element';
import { FoTagListElement } from './components/tag-list/tag-list.element';
import { FoMaskDirective } from './directives/mask.directive';
import { LongPressDirective } from './directives/long-press.directive';
import { FoTagListDirective } from './components/tag-list/tag-list.directive';
import { InfoIconElement } from './components/info-icon/info-icon.element';
import { PrettyPrintElement } from './components/pretty-print/pretty-print.element';
import { FoSliderElement } from './components/slider/slider.element';
import { ToastElement } from './components/toast/toast.element';
import { FoChartElement } from './components/fo-chart/fo-chart.element';
import { ToastService } from './components/toast/toast.service';
import { FoPaneContentElement } from './components/pane-manager/pane-content/pane-content.element';


jModule({
    requiredModules:[],
    selectors: [
        FoAceEditorDirective,
        FoMaskDirective,
        LongPressDirective
    ]
})
export function FoCommonDirectivesModule() {}

jModule({
    requiredModules: [
        CommonModule,
        FormModule,
        RouterModule,
        FoCommonDirectivesModule
    ],
    services: [
        ToastService
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
        FoAccordionElement,
        OffCanvasElement,
        FoPaneManagerElement,
        FoPaneContentElement,
        IconGridElement,
        RatingElement,
        FoHeaderElement,
        SpinnerElement,
        FoTagListElement,
        FoTagListDirective,
        InfoIconElement,
        DropDownItemElement,
        PrettyPrintElement,
        FoSliderElement,
        ToastElement,
        FoChartElement
    ]
})
export class FoCommonModule {}