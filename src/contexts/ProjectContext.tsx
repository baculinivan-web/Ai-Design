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
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';

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
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function normalizeDesign(id: string, data: Partial<DesignItem>): DesignItem {
  const createdAt = data.createdAt && typeof data.createdAt === 'object' && 'toMillis' in data.createdAt
    ? (data.createdAt as { toMillis: () => number }).toMillis()
    : data.createdAt;

  return {
    id,
    image: typeof data.image === 'string' ? data.image : '',
    html: typeof data.html === 'string' ? data.html : '',
    title: typeof data.title === 'string' && data.title.trim() ? data.title : 'design',
    createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
  };
}

function normalizeDesigns(value: unknown): DesignItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Partial<DesignItem> => !!item && typeof item === 'object')
    .map((item) => normalizeDesign(typeof item.id === 'string' ? item.id : generateId(), item));
}

function mergeDesigns(primary: DesignItem[], fallback: DesignItem[]): DesignItem[] {
  const seen = new Set<string>();
  return [...primary, ...fallback].filter((design) => {
    if (seen.has(design.id)) return false;
    seen.add(design.id);
    return true;
  });
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeDesigns, setActiveDesigns] = useState<DesignItem[] | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Active project is derived from the projects list to ensure reactivity
  const activeProjectBase = projects.find(p => p.id === activeProjectId) || null;
  const activeProject = activeProjectBase
    ? {
        ...activeProjectBase,
        designs: activeDesigns ? mergeDesigns(activeDesigns, activeProjectBase.designs) : activeProjectBase.designs,
      }
    : null;

  // Real-time subscription to user's projects
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProjectId(null);
      setActiveDesigns(null);
      setProjectsLoading(false);
      return;
    }

    // Only set loading to true if we don't have projects yet
    // This avoids flickering on every small change or re-subscription
    if (projects.length === 0) {
      setProjectsLoading(true);
    }

    const projectsRef = collection(db, 'users', user.uid, 'projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const projectsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: typeof data.name === 'string' ? data.name : 'untitled project',
          designs: normalizeDesigns(data.designs),
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        };
      });

      setProjects(projectsList);
      
      if (isInitialLoad) {
        setProjectsLoading(false);
        isInitialLoad = false;
      }

      // Migration: if Firestore is empty, check localStorage
      if (snapshot.empty) {
        const localKey = `mono_projects:${user.uid}`;
        const saved = localStorage.getItem(localKey);
        if (saved) {
          try {
            const localProjects = JSON.parse(saved) as Project[];
            if (localProjects.length > 0) {
              // Migrate each project to Firestore in the background
              // We don't set projectsLoading(true) here to avoid UI flickering
              for (const project of localProjects) {
                await setDoc(doc(db, 'users', user.uid, 'projects', project.id), project);
              }
              // Remove from localStorage after successful migration
              localStorage.removeItem(localKey);
            }
          } catch (error) {
            console.error('Failed to migrate projects from localStorage:', error);
          }
        }
      }
    }, (error) => {
      console.error('Firestore subscription error:', error);
      setProjectsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]); // Use user.uid for better stability

  useEffect(() => {
    if (!user || !activeProjectId) {
      setActiveDesigns(null);
      return;
    }

    const designsRef = collection(db, 'users', user.uid, 'projects', activeProjectId, 'designs');
    const q = query(designsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const designsList = snapshot.docs.map(doc => normalizeDesign(doc.id, doc.data()));
      setActiveDesigns(designsList);
    }, (error) => {
      console.error('Firestore designs subscription error:', error);
      setActiveDesigns([]);
    });

    return () => unsubscribe();
  }, [user?.uid, activeProjectId]);

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

    const designId = generateId();
    
    // Upload image to Firebase Storage instead of storing in Firestore
    const imageRef = ref(storage, `users/${user.uid}/projects/${projectId}/designs/${designId}.png`);
    await uploadString(imageRef, design.image, 'data_url');
    const imageUrl = await getDownloadURL(imageRef);

    const newDesign: DesignItem = {
      ...design,
      image: imageUrl, // Store URL instead of base64
      id: designId,
      createdAt: Date.now(),
    };

    const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
    const designRef = doc(projectRef, 'designs', designId);
    
    await setDoc(designRef, newDesign);
    await updateDoc(projectRef, { updatedAt: Date.now() });
  }, [user]);

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
