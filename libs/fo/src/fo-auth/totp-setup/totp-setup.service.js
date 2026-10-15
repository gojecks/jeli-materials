import { AUTH_DATABASE_SERIVCE } from '../tokens';

// a custom $ajax may resolve failed requests with the error object instead of rejecting
const unwrapTotpResponse = res => (res && res.status === 'success') ? res : Promise.reject(res || {});

Service({
    DI: [AUTH_DATABASE_SERIVCE]
})
export class TotpSetupService {
    constructor(databaseService) {
        this.databaseService = databaseService;
    }

    setup() {
        return this.databaseService.core.api('/v2/2fa/setup').then(unwrapTotpResponse);
    }

    enable(code) {
        return this.databaseService.core.api({
            path: '/v2/2fa/enable',
            method: 'POST',
            data: { code }
        }).then(unwrapTotpResponse);
    }

    status() {
        return this.databaseService.core.api('/v2/2fa/status').then(unwrapTotpResponse).then(res => res.result);
    }

    disable(code) {
        return this.databaseService.core.api({
            path: '/v2/2fa/disable',
            method: 'DELETE',
            data: { code }
        }).then(unwrapTotpResponse);
    }

    listDevices() {
        return this.databaseService.core.api('/v2/2fa/devices').then(unwrapTotpResponse).then(res => res.result || []);
    }

    // no id: stop trusting every device
    revokeDevice(id = null) {
        return this.databaseService.core.api({
            path: '/v2/2fa/devices',
            method: 'DELETE',
            data: id ? { id } : {}
        }).then(unwrapTotpResponse);
    }

    regenerateRecoveryCodes(code) {
        return this.databaseService.core.api({
            path: '/v2/2fa/recovery-codes',
            method: 'POST',
            data: { code }
        }).then(unwrapTotpResponse).then(res => res.result.recoveryCodes);
    }
}
