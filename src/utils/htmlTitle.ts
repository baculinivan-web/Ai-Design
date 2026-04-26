export function extractHtmlTitle(html: string): string | null {
  if (!html) return null;

  // Prefer parsing as real HTML so entities (e.g. &amp;) are decoded correctly.
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = doc.querySelector('title')?.textContent?.trim();
    if (title) return title;
  } catch {
    // ignore
  }

  // Fallback for environments where DOMParser might be unavailable.
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  const title = match[1].replace(/\s+/g, ' ').trim();
  return title || null;
}

export function safeDownloadBasename(name: string): string {
  const trimmed = (name || '').trim();
  const base = trimmed || 'design';

  // Replace characters that are invalid in common filesystems (and awkward in downloads).
  const cleaned = base.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
  return cleaned || 'design';
}

