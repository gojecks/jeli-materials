import { FoAnalyticsService } from './fo-analytics.service';
import { ANALYTICS_CONFIG } from './tokens';
jModule({
    services: [
        FoAnalyticsService
    ]
})
export function FoAnalyticsModule() {}
FoAnalyticsModule.bootStrapAnalytics = function(config) {
    Object.assign(ANALYTICS_CONFIG, config);
    FoAnalyticsService.setupAnalytics();
}