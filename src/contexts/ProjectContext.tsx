import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Project, DesignItem } from '../types';
import { useAuth } from './AuthContext';

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

const LEGACY_STORAGE_KEY = 'mono_projects';

function getStorageKey(uid: string | undefined): string {
  return uid ? `mono_projects:${uid}` : 'mono_projects:guest';
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = useMemo(() => getStorageKey(user?.uid), [user?.uid]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Load projects whenever storageKey changes
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProject(null);
      return;
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch {
        setProjects([]);
      }
    } else {
      // Legacy migration: on first load with a signed-in user, 
      // if the legacy mono_projects key exists, copy it over and remove it.
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySaved) {
        try {
          const legacyProjects = JSON.parse(legacySaved);
          setProjects(legacyProjects);
          localStorage.setItem(storageKey, legacySaved);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          setProjects([]);
        }
      } else {
        setProjects([]);
      }
    }
    setActiveProject(null);
  }, [storageKey, user]);

  // Persist projects whenever they change
  useEffect(() => {
    if (user && projects.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(projects));
    } else if (user && projects.length === 0) {
      // If we have a user but projects are empty, we still want to save the empty array
      // to distinguish from the "no projects saved" state (which triggers migration)
      localStorage.setItem(storageKey, JSON.stringify([]));
    }
  }, [projects, storageKey, user]);

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
