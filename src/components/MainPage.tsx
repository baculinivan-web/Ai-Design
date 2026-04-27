import { useState, useRef, useEffect } from 'react';
import type { DesignState } from '../types';
import { generateDesign, type ModelId } from '../services/api';
import { convertHtmlToImage } from '../services/imageConverter';
import { useProjects } from '../contexts/ProjectContext';
import { PromptInput } from './PromptInput';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorMessage } from './ErrorMessage';
import { ProjectNameModal } from './ProjectNameModal';
import { ProjectsList } from './ProjectsList';
import { Download, Copy, Plus, ArrowLeft } from 'lucide-react';
import './MainPage.css';
import { extractHtmlTitle, safeDownloadBasename } from '../utils/htmlTitle';

export function MainPage() {
  const {
    projects,
    activeProject,
    createProject,
    selectProject,
    closeProject,
    addDesignToProject,
  } = useProjects();

  const [state, setState] = useState<DesignState>({
    status: 'idle',
    prompt: '',
    html: null,
    image: null,
    error: null,
  });

  const [selectedModel, setSelectedModel] = useState<ModelId>('nvidia/glm-4.7');
  const [activeDesignIndex, setActiveDesignIndex] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const designs = activeProject?.designs ?? [];

  useEffect(() => {
    if (galleryRef.current && designs.length > 0) {
      galleryRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setActiveDesignIndex(0);
    }
  }, [designs.length]);

  const handleGenerate = async () => {
    if (!state.prompt.trim() || !activeProject) return;

    setState(prev => ({ ...prev, status: 'generating', error: null }));

    try {
      const response = await generateDesign(
        { prompt: state.prompt, systemPrompt: '' },
        selectedModel
      );

      setState(prev => ({ ...prev, html: response.html, status: 'converting' }));

      const imageResult = await convertHtmlToImage(response.html);
      const title = extractHtmlTitle(response.html) ?? 'design';

      addDesignToProject(activeProject.id, {
        image: imageResult.dataUrl,
        html: response.html,
        title,
      });

      setState(prev => ({ ...prev, image: imageResult.dataUrl, status: 'ready', prompt: '' }));
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message, status: 'error' }));
    }
  };

  const handleRetry = () => {
    setState(prev => ({ ...prev, status: 'idle', error: null }));
  };

  const handleDownload = (image: string, title: string) => {
    const link = document.createElement('a');
    link.download = `${safeDownloadBasename(title)}.png`;
    link.href = image;
    link.click();
  };

  const handleCreateProject = () => {
    setShowNameModal(true);
  };

  const handleProjectNameSubmit = (name: string) => {
    createProject(name);
    setShowNameModal(false);
    setState({
      status: 'idle',
      prompt: '',
      html: null,
      image: null,
      error: null,
    });
  };

  const handleFirstPromptSubmit = () => {
    setShowNameModal(true);
  };

  const handleCloseProject = () => {
    closeProject();
    setState({
      status: 'idle',
      prompt: '',
      html: null,
      image: null,
      error: null,
    });
  };

  const isLoading = state.status === 'generating' || state.status === 'converting';
  const loadingMsg = state.status === 'generating' ? 'Generating your design...' : 'Converting to image...';

  // Home page - show hero and project list if no project is active OR if active project has no designs
  if (!activeProject || (activeProject && designs.length === 0)) {
    return (
      <div className="app-shell centered">
        <div className="top-left-actions">
          {projects.length > 0 && (
            <button className="icon-btn" onClick={handleCreateProject} title="New project">
              <Plus size={24} />
            </button>
          )}
        </div>
        
        <div className="hero">
          <h1 className="hero-title">mono</h1>
          <p className="hero-sub">Describe anything — get a design instantly</p>
          {activeProject && <p className="current-project-label">Project: {activeProject.name}</p>}
        </div>

        <div className="input-area input-area--centered">
          <PromptInput
            value={state.prompt}
            onChange={(value) => setState(prev => ({ ...prev, prompt: value }))}
            onSubmit={activeProject ? handleGenerate : handleFirstPromptSubmit}
            disabled={isLoading}
            docked={false}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        {projects.length > 0 && !activeProject && (
          <div className="home-projects">
            <ProjectsList 
              projects={projects} 
              onSelectProject={selectProject}
            />
          </div>
        )}

        <ProjectNameModal
          isOpen={showNameModal}
          onClose={() => setShowNameModal(false)}
          onSubmit={handleProjectNameSubmit}
        />

        {isLoading && (
          <div className="fullscreen-loading">
            <LoadingIndicator message={loadingMsg} />
          </div>
        )}
      </div>
    );
  }

  // Gallery view - show designs if active project has them
  return (
    <div className="app-shell docked">
      <div className="project-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleCloseProject} title="Back to projects">
            <ArrowLeft size={20} />
          </button>
          <button className="plus-btn" onClick={handleCreateProject} title="New project">
            <Plus size={20} />
          </button>
        </div>
        <h1 className="project-title">{activeProject.name}</h1>
        <div className="header-right">
          {/* Empty for now to balance layout */}
        </div>
      </div>

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

        {designs.length > 0 && !isLoading && (
          <>
            <div className="gallery-track" ref={galleryRef}>
              {designs.map((item, i) => (
                <div
                  key={item.id}
                  className={`gallery-slide ${i === activeDesignIndex ? 'active' : ''}`}
                  onClick={() => setActiveDesignIndex(i)}
                >
                  <div className="img-wrapper">
                    <img src={item.image} alt={item.title} className="gallery-img" />
                    <div className="img-overlay">
                      <button
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); handleDownload(item.image, item.title); }}
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

            {designs.length > 1 && (
              <div className="gallery-dots">
                {designs.map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${i === activeDesignIndex ? 'active' : ''}`}
                    onClick={() => {
                      setActiveDesignIndex(i);
                      galleryRef.current?.scrollTo({ left: i * galleryRef.current.offsetWidth, behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="input-area input-area--docked">
        <PromptInput
          value={state.prompt}
          onChange={(value) => setState(prev => ({ ...prev, prompt: value }))}
          onSubmit={handleGenerate}
          disabled={isLoading}
          docked={true}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      <ProjectNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onSubmit={handleProjectNameSubmit}
      />
    </div>
  );
}
