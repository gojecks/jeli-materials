import { LazyLoader } from '@jeli/core';
import { ANALYTICS_CONFIG } from './tokens';
Service()
export function FoAnalyticsService() {}

FoAnalyticsService.pushEvent = function() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
};

FoAnalyticsService.setupAnalytics = function() {
    var tagManagerUrl = 'https://www.googletagmanager.com/gtag/js?id=';
    if (ANALYTICS_CONFIG.propertyId) {
        LazyLoader.staticLoader([tagManagerUrl + ANALYTICS_CONFIG.propertyId], function() {
            FoAnalyticsService.pushEvent('js', new Date());
            FoAnalyticsService.pushEvent('config', ANALYTICS_CONFIG.propertyId);

        }, 'js');
    }
};