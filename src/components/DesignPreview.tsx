import { useEffect, useRef } from 'react';
import './DesignPreview.css';
import { extractHtmlTitle } from '../utils/htmlTitle';

interface DesignPreviewProps {
  html: string;
}

export function DesignPreview({ html }: DesignPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeTitle = extractHtmlTitle(html) ?? 'Design Preview';

  useEffect(() => {
    if (containerRef.current && html) {
      const iframe = containerRef.current.querySelector('iframe');
      if (iframe) {
        const doc = iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        }
      }
    }
  }, [html]);

  return (
    <div className="design-preview" ref={containerRef}>
      <iframe title={iframeTitle} className="preview-iframe" />
    </div>
  );
}
