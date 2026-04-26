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

export async function convertHtmlToImage(html: string): Promise<ConvertResult> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '0';
  iframe.style.top = '0';
  // Large enough to avoid clipping layouts that rely on viewport size.
  iframe.style.width = '2048px';
  iframe.style.height = '2048px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-1';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error('Cannot access iframe document');

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for full render (fonts, images, layout)
    await waitForIframeRender(doc);

    // Find .canvas element
    const canvasEl = doc.querySelector<HTMLElement>('.canvas');
    const bodyEl = doc.body;
    const targetEl = canvasEl ?? bodyEl;
    if (!targetEl || !bodyEl) throw new Error('Cannot access iframe body');

    const win = iframe.contentWindow;
    if (!win) throw new Error('Cannot access iframe window');

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
      foreignObjectRendering: true,
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
