import { useState, useRef, useEffect } from 'react';
import type { DesignState } from '../types';
import { generateDesign, type ModelId } from '../services/api';
import { convertHtmlToImage } from '../services/imageConverter';
import { PromptInput } from './PromptInput';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorMessage } from './ErrorMessage';
import { Download, Copy } from 'lucide-react';
import './MainPage.css';

interface DesignItem {
  image: string;
  html: string;
  title: string;
}

export function MainPage() {
  const [state, setState] = useState<DesignState>({
    status: 'idle',
    prompt: '',
    html: null,
    image: null,
    error: null,
  });

  const [selectedModel, setSelectedModel] = useState<ModelId>('nvidia/glm-4.7');
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const docked = designs.length > 0 || state.status === 'generating' || state.status === 'converting';

  useEffect(() => {
    if (galleryRef.current && designs.length > 0) {
      galleryRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setActiveIndex(0);
    }
  }, [designs.length]);

  const handleGenerate = async () => {
    if (!state.prompt.trim()) return;

    setState(prev => ({ ...prev, status: 'generating', error: null }));

    try {
      const response = await generateDesign(
        { prompt: state.prompt, systemPrompt: '' },
        selectedModel
      );

      setState(prev => ({ ...prev, html: response.html, status: 'converting' }));

      const imageResult = await convertHtmlToImage(response.html);
      const titleMatch = response.html.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'design';

      setDesigns(prev => [{ image: imageResult.dataUrl, html: response.html, title }, ...prev]);

      setState(prev => ({ ...prev, image: imageResult.dataUrl, status: 'ready' }));
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message, status: 'error' }));
    }
  };

  const handleRetry = () => {
    setState(prev => ({ ...prev, status: 'idle', error: null }));
  };

  const handleDownload = (item: DesignItem) => {
    const link = document.createElement('a');
    link.download = `${item.title}.png`;
    link.href = item.image;
    link.click();
  };

  const isLoading = state.status === 'generating' || state.status === 'converting';
  const loadingMsg = state.status === 'generating' ? 'Generating your design...' : 'Converting to image...';

  return (
    <div className={`app-shell ${docked ? 'docked' : 'centered'}`}>

      {!docked && (
        <div className="hero">
          <h1 className="hero-title">AI Designer</h1>
          <p className="hero-sub">Describe anything — get a design instantly</p>
        </div>
      )}

      {docked && (
        <div className="gallery-area">
          {isLoading && (
            <div className="gallery-loading">
              <LoadingIndicator message={loadingMsg} />
            </div>
          )}

          {state.status === 'error' && state.error && (
            <div className="gallery-error">
              <ErrorMessage message={state.error} onRetry={handleRetry} />
            </div>
          )}

          {designs.length > 0 && (
            <div className="gallery-track" ref={galleryRef}>
              {designs.map((item, i) => (
                <div
                  key={i}
                  className={`gallery-slide ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                >
                  <div className="img-wrapper">
                    <img src={item.image} alt={item.title} className="gallery-img" />
                    <div className="img-overlay">
                      <button 
                        className="icon-btn" 
                        onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                        title="Download PNG"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(item.html);
                        }}
                        title="Copy HTML"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {designs.length > 1 && (
            <div className="gallery-dots">
              {designs.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => {
                    setActiveIndex(i);
                    galleryRef.current?.scrollTo({ left: i * galleryRef.current.offsetWidth, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className={`input-area ${docked ? 'input-area--docked' : 'input-area--centered'}`}>
        <PromptInput
          value={state.prompt}
          onChange={(value) => setState(prev => ({ ...prev, prompt: value }))}
          onSubmit={handleGenerate}
          disabled={isLoading}
          docked={docked}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    </div>
  );
}
