import type { Project } from '../types';
import './ProjectsList.css';

interface ProjectsListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
}

export function ProjectsList({ projects, onSelectProject }: ProjectsListProps) {
  return (
    <div className="projects-list">
      <div className="projects-header">
        <h2 className="projects-title">Your Projects</h2>
      </div>
      
      {projects.length === 0 ? (
        <div className="projects-empty">
          <p>No projects yet</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <button
              key={project.id}
              className="project-item"
              onClick={() => onSelectProject(project.id)}
            >
              <span className="project-name">{project.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
