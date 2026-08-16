import { useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';

const WATERMARK_KEYWORDS = ['妙搭', '由妙搭', 'MiaoDa', 'miaoda'];
const WATERMARK_CLASS_HINTS = [
  'watermark',
  'water-mark',
  'doubao',
  'miaoda',
];

function matchesWatermark(el: Element): boolean {
  const text = el.textContent || '';
  if (text && WATERMARK_KEYWORDS.some((kw) => text.includes(kw))) {
    return true;
  }
  const cls = (el.getAttribute('class') || '').toLowerCase();
  const id = (el.id || '').toLowerCase();
  const customEl = el.getAttribute?.('data-custom-element') || '';
  const hints = [...WATERMARK_CLASS_HINTS];
  if (
    hints.some((h) => cls.includes(h) || id.includes(h) || customEl.includes(h))
  ) {
    return true;
  }
  const aria = el.getAttribute('aria-label') || '';
  const title = el.getAttribute('title') || '';
  if (
    WATERMARK_KEYWORDS.some((kw) => aria.includes(kw) || title.includes(kw))
  ) {
    return true;
  }
  return false;
}

function hideElement(el: Element): void {
  const htmlEl = el as HTMLElement;
  htmlEl.style.display = 'none';
  htmlEl.style.visibility = 'hidden';
  htmlEl.style.opacity = '0';
  htmlEl.style.pointerEvents = 'none';
  htmlEl.style.width = '0';
  htmlEl.style.height = '0';
  htmlEl.style.overflow = 'hidden';
}

function scanRoot(root: ParentNode): number {
  let count = 0;
  const all = root.querySelectorAll('*');
  for (const el of all) {
    if (matchesWatermark(el)) {
      hideElement(el);
      count += 1;
    }
    const shadow = (el as HTMLElement).shadowRoot;
    if (shadow) {
      count += scanRoot(shadow);
    }
  }
  return count;
}

export function useWatermarkRemover(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let attempts = 0;
    const maxAttempts = 15;
    const intervalMs = 2000;

    const run = () => {
      attempts += 1;
      try {
        const hidden = scanRoot(document.documentElement);
        if (hidden > 0 && process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          logger.info(`[watermark-remover] hidden ${hidden} elements (attempt ${attempts})`);
        }
      } catch (err) {
        // ignore
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    };

    run();
    const timer = window.setInterval(run, intervalMs);

    const observer = new MutationObserver(() => {
      scanRoot(document.documentElement);
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearInterval(timer);
      observer.disconnect();
    };
  }, []);
}
