import { Plus, Folder } from 'lucide-react';
import type { Project } from '../types';
import './ProjectsList.css';

interface ProjectsListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
}

export function ProjectsList({ projects, onSelectProject, onCreateProject }: ProjectsListProps) {
  return (
    <div className="projects-list">
      <div className="projects-header">
        <h2 className="projects-title">Projects</h2>
        <button className="create-project-btn" onClick={onCreateProject} title="New project">
          <Plus size={18} />
        </button>
      </div>
      
      {projects.length === 0 ? (
        <div className="projects-empty">
          <p>No projects yet</p>
        </div>
      ) : (
        <div className="projects-items">
          {projects.map(project => (
            <button
              key={project.id}
              className="project-item"
              onClick={() => onSelectProject(project.id)}
            >
              <Folder size={16} className="project-icon" />
              <span className="project-name">{project.name}</span>
              <span className="project-count">{project.designs.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
