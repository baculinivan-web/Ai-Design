import './DesignPreview.css';
import { extractHtmlTitle } from '../utils/htmlTitle';

interface DesignPreviewProps {
  html: string;
}

export function DesignPreview({ html }: DesignPreviewProps) {
  const iframeTitle = extractHtmlTitle(html) ?? 'Design Preview';

  return (
    <div className="design-preview">
      <iframe
        title={iframeTitle}
        className="preview-iframe"
        sandbox=""
        srcDoc={html}
      />
    </div>
  );
}
