import { FoTokenService } from "../fo-auth-token.service";
import { AUTH_SESSION_PROVIDER } from "../tokens";
import { SessionManagementService } from "./session-management.service";
Element({
    selector: 'fo-session-management',
    templateUrl: './session-management.element.html',
    styleUrl: './session-management.element.scss',
    DI: [AUTH_SESSION_PROVIDER, FoTokenService, "changeDetector?"],
    props: ['isActive']
})
export function SessionManagementElement(sessionConfig, foTokenService, changeDetector) {
    this.sessionService = new SessionManagementService(sessionConfig);
    this.changeDetector = changeDetector;
    this.foTokenService = foTokenService;
    this._isActive = false;
    this.showAlert = false;
    this.alertType = null;

    Object.defineProperty(this, 'isActive', {
        set: function(value) {
            this._isActive = value;
            if (!this.sessionService.started) {
                this.sessionService.startWatch(foTokenService.getAccessToken());
            }
        }
    });

    /**
     * subscribe to token update
     */
    foTokenService.onTokenUpdate.subscribe((updated) => {
        if (updated) {
            this.sessionService.startWatch(foTokenService.getAccessToken());
        }
    });
}

SessionManagementElement.prototype.didInit = function() {
    this.sessionService.emitter.subscribe(event => {
        if (this.sessionService.eventsName.indexOf(event.type) > 1) {
            this.showAlert = true;
            this.alertType = event.type
        } else {
            this.showAlert = false;
        }
        this.changeDetector.onlySelf();
    });
}