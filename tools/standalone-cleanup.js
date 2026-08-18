#!/usr/bin/env node
/**
 * Post-build cleanup for standalone (Vercel) deployments.
 *
 * The Vite preset injects platform-specific scripts (slardar monitoring,
 * bytedance performance, template variables like {{appId}}) into index.html.
 * Outside the Miaoda platform those template vars are never replaced and the
 * external CDN scripts fail, causing a blank page.
 *
 * Usage: node tools/standalone-cleanup.js
 * Run after `npm run build:client` to sanitize dist/client/index.html.
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.resolve(process.cwd(), 'dist/client/index.html');
const SOURCE_HTML = path.resolve(process.cwd(), 'client/index.html');

const P = '[standalone-cleanup]';
const out = (msg) => process.stdout.write(P + ' ' + msg + '\n');
const warn = (msg) => process.stderr.write(P + ' ' + msg + '\n');

if (!fs.existsSync(INDEX_PATH)) {
  warn('index.html not found at ' + INDEX_PATH);
  process.exit(1);
}

const source = fs.readFileSync(SOURCE_HTML, 'utf8');

function extractMeta(name) {
  const re = new RegExp('<meta[^>]*name="' + name + '"[^>]*content="([^"]*)"', 'i');
  const m = source.match(re);
  if (m) return m[1];
  const re2 = new RegExp('<meta[^>]*content="([^"]*)"[^>]*name="' + name + '"', 'i');
  const m2 = source.match(re2);
  return m2 ? m2[1] : '';
}

const titleMatch = source.match(/<title>([^<]*)<\/title>/);
const iconMatch = source.match(/<link[^>]*rel="icon"[^>]*href="([^"]*)"/i)
  || source.match(/<link[^>]*href="([^"]*)"[^>]*rel="icon"/i);
const appName = titleMatch ? titleMatch[1] : 'Brand CMS';
const appDescription = extractMeta('description');
const appAvatar = iconMatch ? iconMatch[1] : '/favicon.svg';
const keywords = extractMeta('keywords');

let html = fs.readFileSync(INDEX_PATH, 'utf8');
const originalSize = html.length;

function removeScriptContaining(needle) {
  let removed = 0;
  let idx = html.indexOf(needle);
  while (idx !== -1) {
    const scriptStart = html.lastIndexOf('<script', idx);
    if (scriptStart === -1) break;
    const openEnd = html.indexOf('>', scriptStart);
    if (openEnd === -1) break;
    const closeIdx = html.indexOf('</script>', openEnd + 1);
    if (closeIdx === -1) break;
    const closeEnd = closeIdx + '</script>'.length;
    html = html.slice(0, scriptStart) + html.slice(closeEnd);
    removed += 1;
    idx = html.indexOf(needle, scriptStart);
  }
  return removed;
}

const slardarStubRemoved = removeScriptContaining('window.__slardarErrBuf');
const slardarLoaderRemoved = removeScriptContaining("slardarScript = document.createElement('script')");
const teaRemoved = removeScriptContaining('LogAnalyticsObject');

let perfRemoved = 0;
html = html.replace(
  /<script[^>]*src="[^"]*byted\/performance[^"]*"[^>]*><\/script>/g,
  () => { perfRemoved += 1; return ''; }
);

html = html.replace(/<noscript>[\s\S]*?slardar[\s\S]*?<\/noscript>/gi, '');

const globalsPattern = /<script>[\s\S]*?window\.csrfToken\s*=[\s\S]*?window\.__BASENAME__\s*=\s*"[^"]*";[\s\S]*?<\/script>/;
if (globalsPattern.test(html)) {
  html = html.replace(
    globalsPattern,
    '<script>\nwindow.csrfToken = "";\nwindow.userId = "";\nwindow.tenantId = "";\nwindow.appId = "";\nwindow.ENVIRONMENT = "production";\nwindow._appInfo = null;\nwindow.__BASENAME__ = "/";\nwindow.__platform__ = {};\nwindow.IS_MIAODA_PREVIEW = false;\nwindow.collectEvent = function() {};\nwindow.collectEvent.q = [];\nwindow.KSlardarWeb = function() {};\n</script>'
  );
}

html = html.replace(/\{\{appName\}\}/g, appName);
html = html.replace(/\{\{appDescription\}\}/g, appDescription);
html = html.replace(/\{\{appAvatar\}\}/g, appAvatar);
html = html.replace(/\{\{currentUrl\}\}/g, '/');
html = html.replace(/\{\{basename\}\}/g, '/');
if (keywords) {
  html = html.replace(
    /<meta[^>]*name="keywords"[^>]*content="[^"]*"/i,
    '<meta name="keywords" content="' + keywords + '"'
  );
}

html = html.replace(/\n{3,}/g, '\n\n');

const newSize = html.length;
fs.writeFileSync(INDEX_PATH, html, 'utf8');

out(originalSize.toLocaleString() + ' → ' + newSize.toLocaleString() + ' bytes (-' + (originalSize - newSize).toLocaleString() + ')');
out('removed: slardar-stub=' + slardarStubRemoved + ' slardar-loader=' + slardarLoaderRemoved + ' byted-perf=' + perfRemoved + ' tea-analytics=' + teaRemoved);

const remaining = html.match(/\{\{[^}]+\}\}/g);
if (remaining && remaining.length > 0) {
  warn('WARNING remaining template vars: ' + [...new Set(remaining)].join(', '));
} else {
  out('all template variables replaced ✓');
}

const scriptCount = (html.match(/<script/g) || []).length;
const cssCount = (html.match(/stylesheet/g) || []).length;
out('remaining: ' + scriptCount + ' script tags, ' + cssCount + ' stylesheet links');
