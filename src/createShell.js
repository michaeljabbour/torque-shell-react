import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '../dist');

function safeConfigJson(config) {
  return JSON.stringify(config).replace(/<\/script>/gi, '<\\/script>');
}

function generateDevHtml(config) {
  const safeJson = safeConfigJson(config);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Torque Shell</title>
    <script>window.__TORQUE_CONFIG__ = ${safeJson};</script>
  </head>
  <body>
    <div id="root"></div>
    <p>Run <code>npm run build</code> to build the application.</p>
  </body>
</html>`;
}

export function createShell(config = {}) {
  const router = express.Router();

  // Serve static assets (JS, CSS, images) but NOT index.html — we inject config into that
  if (existsSync(distDir)) {
    router.use(express.static(distDir, { index: false }));
  }

  router.get('*', (req, res, next) => {
    const reqPath = req.path;
    if (
      reqPath.startsWith('/api/') ||
      reqPath.startsWith('/bundles/') ||
      reqPath.startsWith('/health')
    ) {
      return next();
    }

    const indexPath = join(distDir, 'index.html');
    if (existsSync(indexPath)) {
      try {
        const html = readFileSync(indexPath, 'utf-8');
        const injected = html.replace(
          '</head>',
          `<script>window.__TORQUE_CONFIG__ = ${safeConfigJson(config)};</script></head>`
        );
        return res.send(injected);
      } catch {
        return res.send(generateDevHtml(config));
      }
    }

    return res.send(generateDevHtml(config));
  });

  return router;
}
