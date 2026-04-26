import html2canvas from 'html2canvas';

export interface ConvertResult {
  dataUrl: string;
  width: number;
  height: number;
}

export async function convertHtmlToImage(html: string): Promise<ConvertResult> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '0';
  iframe.style.top = '0';
  iframe.style.width = '1200px';
  iframe.style.height = '1200px';
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

    // Wait for full render
    await new Promise(resolve => setTimeout(resolve, 800));

    // Find .canvas element
    const canvasEl = doc.querySelector('.canvas') as HTMLElement;
    const targetEl = canvasEl || doc.body;

    // Get dimensions
    const computedStyle = iframe.contentWindow?.getComputedStyle(targetEl);
    const width = parseFloat(computedStyle?.width || '800');
    const height = parseFloat(computedStyle?.height || '800');

    console.log('Rendering element:', targetEl.className, 'size:', width, 'x', height);

    const canvas = await html2canvas(targetEl, {
      width,
      height,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      windowWidth: width,
      windowHeight: height,
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    return { dataUrl, width, height };
  } finally {
    document.body.removeChild(iframe);
  }
}
