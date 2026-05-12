import { useCallback, useEffect, useRef, useState } from 'react';
import { extractHtmlTitle } from '../utils/htmlTitle';
import './HtmlDesignFrame.css';

interface HtmlDesignFrameProps {
  html: string;
  title?: string;
  className?: string;
  maxHeightOffset?: number;
}

type FrameSize = {
  width: number;
  height: number;
};

const DEFAULT_SIZE: FrameSize = { width: 800, height: 1000 };

function getDesignSize(doc: Document): FrameSize {
  const canvas = doc.querySelector<HTMLElement>('.canvas');
  const target = canvas || doc.body || doc.documentElement;
  const rect = target.getBoundingClientRect();
  const width = Math.ceil(rect.width || target.scrollWidth || DEFAULT_SIZE.width);
  const height = Math.ceil(rect.height || target.scrollHeight || DEFAULT_SIZE.height);

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

export function HtmlDesignFrame({ html, title, className = '', maxHeightOffset = 0 }: HtmlDesignFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [designSize, setDesignSize] = useState<FrameSize>(DEFAULT_SIZE);
  const [scale, setScale] = useState(1);
  const iframeTitle = title || extractHtmlTitle(html) || 'Design Preview';

  const updateScale = useCallback((size = designSize) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const availableWidth = wrap.parentElement?.clientWidth || wrap.clientWidth || size.width;
    const availableHeight = maxHeightOffset > 0
      ? Math.max(1, window.innerHeight - maxHeightOffset)
      : Number.POSITIVE_INFINITY;
    setScale(Math.min(availableWidth / size.width, availableHeight / size.height));
  }, [designSize, maxHeightOffset]);

  const handleLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const nextSize = getDesignSize(doc);
    setDesignSize(nextSize);
    updateScale(nextSize);
  }, [updateScale]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const handleResize = () => updateScale();
    const observer = new ResizeObserver(handleResize);
    observer.observe(wrap.parentElement || wrap);
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScale]);

  return (
    <div
      ref={wrapRef}
      className={`html-design-frame ${className}`.trim()}
      style={{
        width: `${designSize.width * scale}px`,
        height: `${designSize.height * scale}px`,
      }}
    >
      <iframe
        ref={iframeRef}
        title={iframeTitle}
        className="html-design-frame__iframe"
        sandbox="allow-same-origin"
        scrolling="no"
        srcDoc={html}
        onLoad={handleLoad}
        style={{
          width: `${designSize.width}px`,
          height: `${designSize.height}px`,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}
