import { AuthSessionManager } from "./auth.session.manager";

Service({
    DI: [AuthSessionManager]
})
export class FoAuthPkceService {
    static STORAGE_NAME = '#foAuthKey';
    authConfigs = new Map();
    active = 'saml';
    constructor(authSessionManager) {
        this.authSessionManager = authSessionManager;
    }

    get activeSessions() {
        return this.authSessionManager.getData(FoAuthPkceService.STORAGE_NAME);
    }

    /**
     * 
     * @param {*} config 
     * {
     *    name: 'oauth identifier',
     *    data: {
     *      authorizeUrl: string;
     *      clientId: string;
     *      redirectUri: string;
     *      tokenUrl: string;
     *      logoutUrl: string;
     *      scope: string;
     *    }
     * }
     * @returns Pomise
     */
    authorize(config) {
        return new Promise((resolve, reject) => {
            if (!config || !config.name || !config.data) {
                return reject({ message: `Invalid oAuth configuration defined.` });
            }
            
            const activeSessions = this.activeSessions || {};
            const _retrieveToken = (code, session) => {
                this.getToken(config.data, session, code)
                    .then(data => {
                        Object.assign(session, { data, pending: false });
                        this.saveSessions(activeSessions);
                        resolve(data);
                    }, error => {
                        session.pending = false;
                        reject(error);
                    }).catch(reject);
            };

            // set the current login config
            this.active = config.name;
            this.authConfigs.set(config.name, config.data);
            if (activeSessions && activeSessions[config.name]) {
                const session = activeSessions[config.name];
                if (session.data) {
                    resolve(session.data);
                } else if (session.pending) {
                    const code = new URL(location.href).searchParams.get('code');
                    _retrieveToken(code, session);
                } else {
                    reject({ message: `No session data found for ${config.name}` });
                }
            } else {
                const codeVerifier = this._generateCodeVerifier();
                const redirectUri = this._getRedirectUri(config.data.redirectUri);
                this._generateCodeChallenge(codeVerifier)
                    .then(codeChallenge => {
                        const url = new URL(`${config.data.host}${config.data.apis.authorize}`);
                        url.searchParams.set('response_type', 'code');
                        url.searchParams.set('client_id', config.data.clientId);
                        url.searchParams.set('scope', config.data.scope);
                        if (config.data.popup) {
                            url.searchParams.set('popup', config.data.popup);
                        }

                        url.searchParams.set('redirect_uri', encodeURIComponent(redirectUri))
                        url.searchParams.set('code_challenge', codeChallenge)
                        url.searchParams.set('code_challenge_method', 'S256');

                        activeSessions[config.name] = {
                            pending: true,
                            codeVerifier,
                        };

                        // set sessions
                        this.saveSessions(activeSessions, true);
                        this._performRedirection(url.toString(), config.data.popup)
                            .then(eventData => _retrieveToken(eventData.code, activeSessions[config.name]));
                    });
            }
        });
    }

    /**
     * 
     * @param {*} config 
     * @param {*} session 
     */
    getToken(config, session, code) {
        return this.request(`${config.host}${config.apis.token}`, {
            grant_type: 'authorization_code',
            code,
            redirect_uri: config.redirectUri,
            client_id: config.clientId,
            code_verifier: session.codeVerifier,
        });
    }

    refreshToken() {
        return new Promise((resolve, reject) => {
            const config = this.authConfigs.get(this.active);
            const session = this.activeSessions[this.name];
            if (config && session) {
                return this.request(`${config.host}${config.apis.token}`, {
                    grant_type: 'refresh_token',
                    refresh_token: session.data.refresh_token,
                    client_id: config.clientId,
                }).then(resolve, reject).catch(reject);
            }

            reject({ message: `Invalid oAuth configuration for ${this.active}` });
        });
    }

    signOut() {
        if (this.authConfigs.has(this.name)) {
            this.authConfigs.delete(this.name);
            const sessions = this.activeSessions;
            delete sessions[this.name];
            this.saveSessions(sessions);
            const config = this.authConfigs.get(this.name);
            const url = new URL(`${config.host}${config.apis.logout}`);
            url.searchParams.set('post_logout_redirect_uri', config.data.redirectUri);
            window.location.href = url.toString();
        }
    }

    saveSessions(activeSessions, autoSave) {
        this.authSessionManager.storeData(FoAuthPkceService.STORAGE_NAME, activeSessions, true, autoSave);
    }

    _base64UrlEncode(str) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    _generateCodeVerifier() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return this._base64UrlEncode(array);
    }

    _generateCodeChallenge(verifier) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
            .then(hash => this._base64UrlEncode(hash));
    }
    _getRedirectUri(redirectUri) {
        return redirectUri || (`${location.origin}${location.pathname !== '/' ? location.pathname : ''}`);
    }

    request(url, payload) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(payload),
        }).then(response => response.json())
    }

    _performRedirection(redirectUrl, popup) {
        return new Promise((resolve) => {
            if (popup) {
                const popupConfig = Object.assign({
                    top: 200,
                    left: 200,
                    width: 500,
                    height: 400,
                    location: 'yes',
                    status: 'yes',
                    resizable: 'yes'
                }, typeof popup == 'object' ? popup : {});

                const auth_window = window.open(
                    redirectUrl,
                    'ExternalAuthentication',
                    Object.keys(popupConfig).reduce((accum, k) => (accum += `${k}=${popupConfig[k]},`), ''),
                    true);

                if (!auth_window) return console.log(`[Auth] Window blocked`);

                let eventReceived = false;
                // register event
                const messageHandler = event => {
                    eventReceived = true;
                    if (!event.data) {
                        reject({ message: 'Invalid openId response' });
                    } else {
                        resolve(event.data);
                    }
                };

                window.addEventListener('message', messageHandler, false);
                // handle close
                auth_window.addEventListener('visibilitychange', () => {
                    // remove event listener
                    setTimeout(() => {
                        if (eventReceived) {
                            console.log(`[Auth] window closed`);
                            window.removeEventListener('message', messageHandler);
                        }
                    }, 100);
                });

                auth_window.focus();
            } else {
                // Redirect to the authorization URL
                window.location.href = redirectUrl;
            }
        });
    }
}