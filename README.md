# @torquedev/shell-react

React + MUI application shell that auto-discovers installed bundles and renders their UI. The host renders; bundles stay pure JS.

## Install

```bash
npm install @torquedev/shell-react
```

Or via git dependency:

```bash
npm install git+https://github.com/torque-framework/torque-shell-react.git
```

## How It Works

The shell has two faces:

### Server-side

`createShell(config)` returns an Express router. It serves the built SPA from `dist/` and injects `window.__TORQUE_CONFIG__` into the HTML at runtime — no rebuild needed when config changes.

```js
import { createShell } from '@torquedev/shell-react';

app.use(createShell({
  auth: { bundle: 'identity' },
  shell: { theme: { primary: '#5ee6b8', mode: 'dark' } },
}));
```

### Client-side

The `App` component mounts and calls `/api/introspect` to discover installed bundles. It builds navigation and routes from the introspection response — only bundles that declare a `ui` field get nav items.

## Bundle Rendering

**BundleViewPage** dynamically `import()`s bundle scripts from `/bundles/{name}/{script}`, calls the bundle's `view` function with `{ data, actions }`, and renders the returned descriptor tree through `renderer.jsx`.

```
bundle view function → { type, props, children } descriptors → renderer → MUI React → DOM
```

The `actions` object gives bundles access to: `navigate`, `params`, `api` (fetch with auth), `refresh`, `showDialog`, `closeDialog`, and `showToast`.

## Renderer

`renderDescriptor(descriptor)` translates plain `{ type, props, children }` objects (produced by [@torquedev/ui-kit](https://github.com/torque-framework/torque-ui-kit)) into MUI React components.

Supported types:

| Category | Types |
|----------|-------|
| Layout | `stack`, `grid`, `divider` |
| Data Display | `text`, `card`, `badge` |
| Inputs | `text-field`, `button`, `form` |
| Feedback | `alert`, `spinner` |
| Kanban | `kanban-board`, `kanban-list`, `kanban-card` |
| Overlay | `card-modal` |
| Editing | `inline-edit` |

## Auth

Login and signup pages are built in, gated by `config.auth.bundle`. When an auth bundle is configured the shell wraps routes in an auth guard and provides token management.

## Theme

Dark mode by default (`#0d1117` background, `#5ee6b8` primary). Customizable via:

```js
createDefaultTheme({ primary: '#ff6b6b', mode: 'light' })
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build as library |
| `npm run build:app` | Build SPA to `dist/` |
| `npm run dev:app` | Vite dev server |
| `npm test` | Run tests (Vitest) |

## Dependencies

React 19, MUI v7, React Router v7, Vite 6, Express 4.

## Torque Framework

Part of the [Torque](https://github.com/torque-framework/torque) composable monolith framework.

## License

MIT — see [LICENSE](./LICENSE)
