import html2canvas from 'html2canvas';

export interface ConvertResult {
  dataUrl: string;
  width: number;
  height: number;
}

function isTransparentCssColor(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  if (v === 'transparent') return true;
  if (v.startsWith('rgba(')) {
    const match = v.match(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)$/);
    if (match) return Number(match[1]) === 0;
  }
  return false;
}

function pickCaptureTarget(doc: Document): HTMLElement {
  const canvasEl = doc.querySelector<HTMLElement>('.canvas');
  if (canvasEl) return canvasEl;

  const bodyEl = doc.body;
  if (!bodyEl) throw new Error('Cannot access iframe body');

  const candidates: HTMLElement[] = [];
  const walker = doc.createTreeWalker(bodyEl, NodeFilter.SHOW_ELEMENT);
  let visited = 0;

  while (walker.nextNode()) {
    const el = walker.currentNode as HTMLElement;
    visited += 1;
    if (visited > 800) break;

    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'META') continue;
    if (el === bodyEl || el === doc.documentElement) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width < 240 || rect.height < 240) continue;
    candidates.push(el);
  }

  if (candidates.length === 0) return bodyEl;

  const score = (el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    const area = rect.width * rect.height;
    const aspect = rect.width / rect.height;
    const aspectPenalty = Math.min(1, Math.abs(Math.log(aspect))); // 0 for 1:1, grows as it deviates
    const squareness = 1 - aspectPenalty; // 1..0
    return area * (0.35 + 0.65 * squareness);
  };

  return candidates.reduce((best, el) => (score(el) > score(best) ? el : best));
}

async function waitForIframeRender(doc: Document): Promise<void> {
  // Give the browser a tick to construct layout/style.
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  // Wait for fonts (when supported).
  const fontsReady = (doc as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
  if (fontsReady) {
    try {
      await fontsReady;
    } catch {
      // ignore
    }
  }

  // Wait for images inside the iframe (if any).
  const images = Array.from(doc.images || []);
  await Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  // Final small delay to let layout settle after fonts/images.
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function loadHtmlIntoIframe(iframe: HTMLIFrameElement, html: string): Promise<Document> {
  const loadPromise = new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('Failed to load generated HTML'));
  });

  iframe.srcdoc = html;
  await loadPromise;

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) throw new Error('Cannot access iframe document');
  return doc;
}

export async function convertHtmlToImage(html: string): Promise<ConvertResult> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  // Keep it offscreen but "paintable" — opacity/visibility can cause missing text in some renderers.
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  // Large enough to avoid clipping layouts that rely on viewport size.
  iframe.style.width = '2048px';
  iframe.style.height = '2048px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-1';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  try {
    const doc = await loadHtmlIntoIframe(iframe, html);

    // Wait for full render (fonts, images, layout)
    await waitForIframeRender(doc);

    const bodyEl = doc.body;
    if (!bodyEl) throw new Error('Cannot access iframe body');

    const win = iframe.contentWindow;
    if (!win) throw new Error('Cannot access iframe window');

    const targetEl = pickCaptureTarget(doc);

    // Crop exactly to the design bounds (prevents "shifted" exports when the design is centered in the page).
    const rect = targetEl.getBoundingClientRect();
    const x = Math.max(0, rect.left + win.scrollX);
    const y = Math.max(0, rect.top + win.scrollY);
    const width = Math.max(1, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(rect.height));

    // Ensure a non-transparent default background when the design relies on body background.
    const bodyBg = win.getComputedStyle(bodyEl).backgroundColor;
    const backgroundColor = isTransparentCssColor(bodyBg) ? null : bodyBg;

    const canvas = await html2canvas(bodyEl, {
      x,
      y,
      width,
      height,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      // html2canvas has limited CSS support in its default renderer.
      // foreignObjectRendering uses the browser to render the DOM into an SVG foreignObject,
      // which fixes common issues like gradient text via background-clip:text.
      // But it can also drop text in some setups; computed rendering is more reliable for typography.
      foreignObjectRendering: false,
      onclone: clonedDoc => {
        // Defensive fix: html2canvas may lose gradient-clipped text when color is transparent.
        // Ensure WebKit text fill + background clip are present in the cloned DOM.
        const gradientTextEls = clonedDoc.querySelectorAll<HTMLElement>('.banner');
        gradientTextEls.forEach(el => {
          (el.style as CSSStyleDeclaration & { webkitTextFillColor?: string; webkitBackgroundClip?: string }).webkitTextFillColor =
            'transparent';
          (el.style as CSSStyleDeclaration & { webkitTextFillColor?: string; webkitBackgroundClip?: string }).webkitBackgroundClip =
            'text';
          el.style.backgroundClip = 'text';
          el.style.color = 'transparent';
          if (!el.style.display) el.style.display = 'inline-block';
        });
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    return { dataUrl, width, height };
  } finally {
    document.body.removeChild(iframe);
  }
}
