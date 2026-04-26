import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Project, DesignItem } from '../types';

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  createProject: (name: string) => Project;
  selectProject: (id: string) => void;
  closeProject: () => void;
  addDesignToProject: (projectId: string, design: Omit<DesignItem, 'id' | 'createdAt'>) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const STORAGE_KEY = 'mono_projects';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const createProject = useCallback((name: string): Project => {
    const project: Project = {
      id: generateId(),
      name,
      designs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects(prev => [project, ...prev]);
    setActiveProject(project);
    return project;
  }, []);

  const selectProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setActiveProject(project);
    }
  }, [projects]);

  const closeProject = useCallback(() => {
    setActiveProject(null);
  }, []);

  const addDesignToProject = useCallback((projectId: string, design: Omit<DesignItem, 'id' | 'createdAt'>) => {
    const newDesign: DesignItem = {
      ...design,
      id: generateId(),
      createdAt: Date.now(),
    };

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          designs: [newDesign, ...p.designs],
          updatedAt: Date.now(),
        };
      }
      return p;
    }));

    setActiveProject(prev => {
      if (prev && prev.id === projectId) {
        return {
          ...prev,
          designs: [newDesign, ...prev.designs],
          updatedAt: Date.now(),
        };
      }
      return prev;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProject?.id === id) {
      setActiveProject(null);
    }
  }, [activeProject]);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, name, updatedAt: Date.now() };
      }
      return p;
    }));
  }, []);

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProject,
      createProject,
      selectProject,
      closeProject,
      addDesignToProject,
      deleteProject,
      renameProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within ProjectProvider');
  }
  return context;
}
