# jeli-materials (`@jeli/materials`)

A component library for [jeli](https://github.com/gojecks/jeli-js) apps: UI components, sign-in flows, file upload,
modals and a Bootstrap-free design system. Built with [jeli-cli](https://github.com/gojecks/jeli-cli).

## Use it

```js
import { FoCommonModule, FoAuthModule, FoModalModule, FilterModule } from '@jeli/materials';

jModule({
    requiredModules: [FoCommonModule, FoAuthModule, FoModalModule, FilterModule],
    selectors: [AppElement]
})
export class AppModule {}
```

The build ships its stylesheet (`bundles/styles.css`, declared as `stylesPath`), and jeli-cli adds it to consuming
apps automatically.

## What's inside (`libs/fo/src`)

| Area | Contents |
|---|---|
| `common/` (`FoCommonModule`) | accordion, butter-bar, check-box, date-picker, drop-down, fo-alert, fo-carousel, fo-chart, fo-header, fo-tree, icon-grid, info-icon, off-canvas, pane-manager, pretty-print, pricing-card, progress-bar, radio-button, rating, scroll-spy, slider, spinner, tag-list, time-ago, toast (+ `ToastService`); directives (long-press, mask); swiper and breakpoint services |
| `common/filters/` (`FilterModule`) | Template pipes |
| `fo-auth/` (`FoAuthModule`) | Sign-in and registration, email-first login, email/SMS sign-in codes, OTP, two-step verification (TOTP setup, MFA challenge, recovery codes, settings), session management, PKCE, per-app sign-in policy |
| `modal/` (`FoModalModule`) | Modal service and components |
| `file-upload/` | Upload element and instant-upload directive, image preview, `UploadService` |
| `image-theatre/` | Image viewer with zoom |
| `payment/` | Payment methods |
| `google-map/`, `fo-ckeditor/`, `draggable/`, `cookies-policy/`, `fo-analytics/` | Their own modules |
| `global-styles/` | The design system: theme tokens, typography, buttons, forms, nav, modal, table, cards, utilities, animations |

## Theming

`global-styles/theme.scss` defines the colour tokens (`--fsb-primary`, `--fsb-primary-hover`, `--fsb-primary-light`
and friends). Override them on `:root`, or per element, to theme every component. Preset accents keep white text
readable (WCAG AA).

## Development (this repo)

```sh
npm install
npm run build     # jeli build -> dist/fo (UMD, module, styles.css, metadata.json)
npm run serve     # jeli serve
npm test          # jeli test
npm run docs      # jeli docs
```

`jeli.json` sets `buildOptions.sass: true`, so styles compile with Dart Sass. Quote colour keywords used as Sass
map keys (`'white'`, `'black'`, `'teal'`, ...), otherwise Sass treats them as colours and silently miscompiles
interpolation.

## License

MIT (see [LICENSE](LICENSE))
