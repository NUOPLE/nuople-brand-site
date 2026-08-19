/* eslint-disable */
/**
 * Post-build cleanup for standalone (Vercel) deployments.
 *
 * The Miaoda fullstack-vite-preset injects platform-specific scripts
 * (slardar monitoring, bytedance performance, tea analytics) and
 * Handlebars-style template variables ({{appId}}, {{appName}}, etc.)
 * into index.html. Outside the Miaoda platform those external CDN
 * scripts fail and the template vars are never replaced, causing
 * runtime errors and a blank page.
 *
 * This script surgically removes only the platform-specific parts
 * while preserving Vite polyfills, CSS detection, and the main
 * app bundle (JS + CSS).
 *
 * Usage: node client/standalone-cleanup.js
 * Run after `npx vite build` to sanitize dist/client/index.html.
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.resolve(__dirname, '../dist/client/index.html');
const SOURCE_HTML = path.resolve(__dirname, 'index.html');

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
const appDescription = extractMeta('description') || appName;
const appAvatar = iconMatch ? iconMatch[1] : './favicon.svg';
const keywords = extractMeta('keywords') || '';

let html = fs.readFileSync(INDEX_PATH, 'utf8');
const originalSize = html.length;

out('Input size: ' + originalSize.toLocaleString() + ' bytes');

/**
 * Find all <script>...</script> block ranges in `html`.
 * Returns [{ start, end }] where start is the index of '<' and end is
 * the index after '</script>'.
 */
function findAllScriptBlocks(str) {
  const blocks = [];
  let i = 0;
  while (i < str.length) {
    const openStart = str.indexOf('<script', i);
    if (openStart === -1) break;
    const openEnd = str.indexOf('>', openStart);
    if (openEnd === -1) break;
    // self-closing check: <script ... /> (unusual but handle)
    if (str[openEnd - 1] === '/') {
      blocks.push({ start: openStart, end: openEnd + 1 });
      i = openEnd + 1;
      continue;
    }
    const closeIdx = str.indexOf('</script>', openEnd + 1);
    if (closeIdx === -1) break;
    const closeEnd = closeIdx + '</script>'.length;
    blocks.push({ start: openStart, end: closeEnd });
    i = closeEnd;
  }
  return blocks;
}

/**
 * Remove all <script> blocks whose body contains `needle`.
 * Returns the number of blocks removed.
 */
function removeScriptsContaining(needle, label) {
  const blocks = findAllScriptBlocks(html);
  let removed = 0;
  // Work backwards so indices stay valid
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    const body = html.slice(b.start, b.end);
    if (body.indexOf(needle) !== -1) {
      html = html.slice(0, b.start) + html.slice(b.end);
      removed += 1;
    }
  }
  if (removed > 0) out('Removed ' + removed + ' ' + label + ' script block(s)');
  return removed;
}

// 1. Remove slardar error monitoring (stub block + dynamic loader block)
removeScriptsContaining('window.__slardarErrBuf', 'slardar-stub');
removeScriptsContaining("slardarScript = document.createElement('script')", 'slardar-loader');

// 2. Remove bytedance performance external script tag
let perfRemoved = 0;
html = html.replace(
  /<script[^>]*src="[^"]*byted\/performance[^"]*"[^>]*><\/script>/g,
  () => { perfRemoved += 1; return ''; }
);
if (perfRemoved > 0) out('Removed ' + perfRemoved + ' bytedance performance script tag(s)');

// 3. Remove tea / collectEvent analytics script block
removeScriptsContaining('LogAnalyticsObject', 'tea-analytics');

// 4. Remove noscript fallback for slardar
const noscriptBefore = html.length;
html = html.replace(/<noscript>[\s\S]*?slardar[\s\S]*?<\/noscript>/gi, '');
if (html.length !== noscriptBefore) out('Removed slardar noscript fallback');

// 5. Replace the platform-globals <script> block with safe stubs
//    Match the block that starts with window.csrfToken and ends with __BASENAME__
const globalsPattern = /<script>[^<]*window\.csrfToken\s*=[\s\S]*?window\.__BASENAME__\s*=\s*"[^"]*";[\s\S]*?<\/script>/;
if (globalsPattern.test(html)) {
  html = html.replace(
    globalsPattern,
    '<script>\n' +
    'window.__platform__={};window.IS_MIAODA_PREVIEW=false;\n' +
    'window.csrfToken="";window.userId="";window.tenantId="";window.appId="";\n' +
    'window.ENVIRONMENT="production";window._appInfo=null;window.__BASENAME__="/";\n' +
    'window.KSlardarWeb=function(){};window.__slardarErrBuf=[];\n' +
    'window.collectEvent=function(){};window.collectEvent.q=[];\n' +
    '</script>'
  );
  out('Replaced platform-globals block with safe stubs');
}

// 6. Replace Handlebars template variables in meta/title/og tags
html = html.replace(/\{\{appName\}\}/g, appName);
html = html.replace(/\{\{appDescription\}\}/g, appDescription);
html = html.replace(/\{\{appAvatar\}\}/g, appAvatar);
html = html.replace(/\{\{currentUrl\}\}/g, './');
html = html.replace(/\{\{basename\}\}/g, './');
if (keywords) {
  html = html.replace(
    /<meta[^>]*name="keywords"[^>]*content="[^"]*"/i,
    '<meta name="keywords" content="' + keywords + '"'
  );
}
out('Replaced template variables (appName, appDescription, appAvatar, etc.)');

// 7. Collapse excessive blank lines
html = html.replace(/\n{3,}/g, '\n\n');

// Write back
const newSize = html.length;
fs.writeFileSync(INDEX_PATH, html, 'utf8');
out('Output size: ' + newSize.toLocaleString() + ' bytes (' +
    (originalSize - newSize > 0 ? '-' : '+') +
    Math.abs(originalSize - newSize).toLocaleString() + ' bytes)');

// Sanity checks
const remaining = html.match(/\{\{[^}]+\}\}/g);
if (remaining && remaining.length > 0) {
  warn('WARNING: remaining template variables: ' + [...new Set(remaining)].join(', '));
} else {
  out('OK: no remaining {{template}} variables');
}

const cssRefs = (html.match(/\.css/g) || []).length;
const linkCss = (html.match(/rel="stylesheet"/g) || []).length;
const noscriptCss = (html.match(/<noscript>[\s\S]*?\.css[\s\S]*?<\/noscript>/g) || []).length;
const jsModules = (html.match(/<script[^>]*type="module"[^>]*src=/g) || []).length;
out('CSS references: ' + cssRefs + ' total, ' + linkCss + ' link-stylesheet, ' + noscriptCss + ' noscript-fallback');
out('JS module entries: ' + jsModules);

const scriptCount = (html.match(/<script/g) || []).length;
out('Total script tags: ' + scriptCount);

// Platform keyword check
const platformKeywords = ['slardar', 'byted/performance', 'LogAnalyticsObject', '__slardarErrBuf', 'lf3-short.ibytedapm'];
let foundPlatform = false;
for (const kw of platformKeywords) {
  if (html.indexOf(kw) !== -1) {
    warn('WARNING: platform keyword still present: ' + kw);
    foundPlatform = true;
  }
}
if (!foundPlatform) out('OK: all platform monitoring scripts removed');

out('Done ✓');
