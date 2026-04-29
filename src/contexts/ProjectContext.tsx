import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Project, DesignItem } from '../types';
import { useAuth } from './AuthContext';
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  projectsLoading: boolean;
  createProject: (name: string) => Promise<string | undefined>;
  selectProject: (id: string) => void;
  closeProject: () => void;
  addDesignToProject: (projectId: string, design: Omit<DesignItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Active project is derived from the projects list to ensure reactivity
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Real-time subscription to user's projects
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProjectId(null);
      setProjectsLoading(false);
      return;
    }

    setProjectsLoading(true);
    const projectsRef = collection(db, 'users', user.uid, 'projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const projectsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      setProjects(projectsList);
      setProjectsLoading(false);

      // Migration: if Firestore is empty, check localStorage
      if (snapshot.empty) {
        const localKey = `mono_projects:${user.uid}`;
        const saved = localStorage.getItem(localKey);
        if (saved) {
          try {
            const localProjects = JSON.parse(saved) as Project[];
            if (localProjects.length > 0) {
              setProjectsLoading(true);
              // Migrate each project to Firestore
              for (const project of localProjects) {
                await setDoc(doc(db, 'users', user.uid, 'projects', project.id), project);
              }
              // Remove from localStorage after successful migration
              localStorage.removeItem(localKey);
            }
          } catch (error) {
            console.error('Failed to migrate projects from localStorage:', error);
          } finally {
            setProjectsLoading(false);
          }
        }
      }
    }, (error) => {
      console.error('Firestore subscription error:', error);
      setProjectsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createProject = useCallback(async (name: string) => {
    if (!user) return;

    const projectId = generateId();
    const project: Project = {
      id: projectId,
      name,
      designs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(doc(db, 'users', user.uid, 'projects', projectId), project);
    setActiveProjectId(projectId);
    return projectId;
  }, [user]);

  const selectProject = useCallback((id: string) => {
    setActiveProjectId(id);
  }, []);

  const closeProject = useCallback(() => {
    setActiveProjectId(null);
  }, []);

  const addDesignToProject = useCallback(async (projectId: string, design: Omit<DesignItem, 'id' | 'createdAt'>) => {
    if (!user) return;

    const newDesign: DesignItem = {
      ...design,
      id: generateId(),
      createdAt: Date.now(),
    };

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedDesigns = [newDesign, ...project.designs];
    
    await updateDoc(doc(db, 'users', user.uid, 'projects', projectId), {
      designs: updatedDesigns,
      updatedAt: Date.now(),
    });
  }, [user, projects]);

  const deleteProject = useCallback(async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, 'users', user.uid, 'projects', id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  }, [user, activeProjectId]);

  const renameProject = useCallback(async (id: string, name: string) => {
    if (!user) return;

    await updateDoc(doc(db, 'users', user.uid, 'projects', id), {
      name,
      updatedAt: Date.now(),
    });
  }, [user]);

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProject,
      projectsLoading,
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
