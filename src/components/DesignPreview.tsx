import './DesignPreview.css';
import { extractHtmlTitle } from '../utils/htmlTitle';
import { HtmlDesignFrame } from './HtmlDesignFrame';

interface DesignPreviewProps {
  html: string;
}

export function DesignPreview({ html }: DesignPreviewProps) {
  const iframeTitle = extractHtmlTitle(html) ?? 'Design Preview';

  return (
    <div className="design-preview">
      <HtmlDesignFrame html={html} title={iframeTitle} />
    </div>
  );
}
