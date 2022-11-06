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
    var _this = this;
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
    foTokenService.onTokenUpdate.subscribe(function(updated) {
        if (updated) {
            _this.sessionService.startWatch(foTokenService.getAccessToken());
        }
    });
}

SessionManagementElement.prototype.didInit = function() {
    var _this = this;
    this.sessionService.emitter.subscribe(function(event) {
        if (_this.sessionService.eventsName.indexOf(event.type) > 1) {
            _this.showAlert = true;
            _this.alertType = event.type
        } else {
            _this.showAlert = false;
        }
        _this.changeDetector.detectChanges();
    });
}