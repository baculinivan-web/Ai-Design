import { useState, useRef, useEffect } from 'react';
import type { DesignState } from '../types';
import { generateDesign, fetchAvailableModels, type ModelId, type ModelInfo } from '../services/api';
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
    renameProject,
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
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [activeDesignIndex, setActiveDesignIndex] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const designs = activeProject?.designs ?? [];

  useEffect(() => {
    void fetchAvailableModels().then((fetchedModels) => {
      setModels(fetchedModels);
      if (fetchedModels.length > 0) {
        // If current selection is empty or not in the new list, pick a new one
        setSelectedModel(prev => {
          // If previous selection exists in new list, keep it
          if (prev && fetchedModels.some(m => m.id === prev)) {
            return prev;
          }
          // Otherwise, prefer the legacy default if it's available
          if (fetchedModels.some(m => m.id === 'nvidia/glm-4.7')) {
            return 'nvidia/glm-4.7';
          }
          // Finally, fall back to the first model in the list
          return fetchedModels[0].id;
        });
      }
    });
  }, []);

  useEffect(() => {
    if (galleryRef.current && designs.length > 0) {
      galleryRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setActiveDesignIndex(0);
    }
  }, [designs.length]);

  const resetComposer = () => {
    setState({
      status: 'idle',
      prompt: '',
      html: null,
      image: null,
      error: null,
    });
  };

  const generateForProject = async (projectId: string, promptText: string) => {
    if (!promptText.trim()) return;

    setState(prev => ({ ...prev, status: 'generating', error: null }));

    try {
      const response = await generateDesign(
        { prompt: promptText, systemPrompt: '' },
        selectedModel
      );

      setState(prev => ({ ...prev, html: response.html, status: 'converting' }));

      const imageResult = await convertHtmlToImage(response.html);
      const title = extractHtmlTitle(response.html) ?? 'design';

      addDesignToProject(projectId, {
        image: imageResult.dataUrl,
        html: response.html,
        title,
      });

      setState(prev => ({ ...prev, image: imageResult.dataUrl, status: 'ready', prompt: '' }));
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message, status: 'error' }));
    }
  };

  const handleGenerate = () => {
    if (!state.prompt.trim() || !activeProject || !selectedModel) return;
    void generateForProject(activeProject.id, state.prompt);
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
    setPendingProjectId(null);
    setShowNameModal(true);
  };

  const handleProjectNameSubmit = (name: string) => {
    if (pendingProjectId) {
      renameProject(pendingProjectId, name);
      setPendingProjectId(null);
      setShowNameModal(false);
      return;
    }

    createProject(name);
    setShowNameModal(false);
    resetComposer();
  };

  const handleFirstPromptSubmit = () => {
    const promptText = state.prompt.trim();
    if (!promptText || !selectedModel) return;

    const project = createProject('untitled project');
    setPendingProjectId(project.id);
    setShowNameModal(true);
    void generateForProject(project.id, promptText);
  };

  const handleCloseProject = () => {
    closeProject();
    setPendingProjectId(null);
    resetComposer();
  };

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    setShowProjects(false);
    setPendingProjectId(null);
    setActiveDesignIndex(0);
    resetComposer();
  };

  const handleCloseModal = () => {
    setShowNameModal(false);
    setPendingProjectId(null);
  };

  const isLoading = state.status === 'generating' || state.status === 'converting';
  const isInputDisabled = isLoading || !selectedModel;
  const loadingMsg = state.status === 'generating' ? 'Generating your design...' : 'Converting to image...';
  const isCenteredView = !activeProject;
  const visibleProjects = activeProject
    ? projects.filter((project) => project.id !== activeProject.id)
    : projects;
  const centeredSubtitle = activeProject
    ? `project: ${activeProject.name}`
    : 'Describe anything - get a design instantly';
  const projectsShelf = visibleProjects.length > 0 && isCenteredView ? (
    <div className="projects-shelf">
      <button
        className="projects-toggle"
        onClick={() => setShowProjects(prev => !prev)}
        type="button"
      >
        {showProjects ? 'hide all projects' : 'show all projects'}
      </button>
      {showProjects && (
        <div className="projects-shelf-content">
          <ProjectsList
            projects={visibleProjects}
            onSelectProject={handleSelectProject}
          />
        </div>
      )}
    </div>
  ) : null;

  if (isCenteredView) {
    return (
      <div className="app-shell centered">
        <div className="top-left-actions">
          {projects.length > 0 && (
            <button className="icon-btn" onClick={handleCreateProject} title="New project">
              <Plus size={24} />
            </button>
          )}
        </div>

        <div className="center-stage">
          <div className="hero">
            <h1 className="hero-title">mono</h1>
            <p className="hero-sub">{centeredSubtitle}</p>
          </div>

          <div className="input-area input-area--centered">
            <PromptInput
              value={state.prompt}
              onChange={(value) => setState(prev => ({ ...prev, prompt: value }))}
              onSubmit={activeProject ? handleGenerate : handleFirstPromptSubmit}
              disabled={isInputDisabled}
              docked={false}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              models={models}
            />
          </div>

          {isLoading && (
            <div className="center-status">
              <LoadingIndicator message={loadingMsg} />
            </div>
          )}

          {state.status === 'error' && state.error && (
            <div className="center-status">
              <ErrorMessage message={state.error} onRetry={handleRetry} />
            </div>
          )}
        </div>

        {projectsShelf}

        <ProjectNameModal
          isOpen={showNameModal}
          onClose={handleCloseModal}
          onSubmit={handleProjectNameSubmit}
          defaultName=""
          title={pendingProjectId ? 'Name project' : 'New project'}
        />
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
        <h1 className="project-title">project: {activeProject.name}</h1>
        <div className="header-right">
          {/* Empty - moved to top-right actions */}
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

        {designs.length === 0 && !isLoading && (
          <div className="gallery-empty">
            <p>No designs yet. Describe something to get started!</p>
          </div>
        )}

        {designs.length > 0 && (
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
          disabled={isInputDisabled}
          docked={true}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          models={models}
        />
      </div>

      <ProjectNameModal
        isOpen={showNameModal}
        onClose={handleCloseModal}
        onSubmit={handleProjectNameSubmit}
        defaultName={pendingProjectId && activeProject ? activeProject.name : ''}
        title={pendingProjectId ? 'Name project' : 'New project'}
      />
    </div>
  );
}
