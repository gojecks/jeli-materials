import { ProviderToken } from "@jeli/core";

export const AUTH_DATABASE_SERIVCE = new ProviderToken('databaseService');
export const AUTH_SESSION_PROVIDER = new ProviderToken('sessionProvider', false, {
    value: {
        idleTime: 300, // time in seconds before trigerring user idle
        timeOutWarn: 15, // percentage of total accessTime
        interval: 1000,
        autoReconnect: true,
        events: ['mousedown', 'keydown', 'touchstart']
    }
});

export const AUTH_STORAGE_PROVIDER = new ProviderToken('storageProvider', false, {
    value: {
        use: true,
        storage: true, //only set to true if you want manager to always handle your data on refresh
        storageType: 0, //supports only local and session storage,
        autoSave: false,
        useVisibilityChange: false
    }
});

export const FO_AUTH_CONFIG = {
    name: 'FO-PAGES',
    organisation: 'ONE-FE',
    pageAfterLogin: '',
    passwordResetPage: '',
    redirectOnPages: [],
    loginPage: '',
    roles: ['ROLE_USER', 'ROLE_ADMIN'],
    openIdURL: 'https://openid.frontendonly.com',
    oauthConfigs: []
};