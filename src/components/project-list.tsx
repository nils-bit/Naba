'use client';

import { useState } from 'react';
import type { Project } from '@/types/database';
import { ProjectForm } from './project-form';

interface ProjectListProps {
  projects: Project[];
  onUpdate: (id: string, name: string, color: string) => void;
  onArchive: (id: string, archived: boolean) => void;
}

export function ProjectList({ projects, onUpdate, onArchive }: ProjectListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="space-y-4">
      {/* Active projects */}
      <div className="space-y-2">
        {active.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">
            Inga aktiva projekt. Lagg till ett ovan.
          </p>
        )}
        {active.map((project) => (
          <div key={project.id}>
            {editingId === project.id ? (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <ProjectForm
                  initialName={project.name}
                  initialColor={project.color}
                  submitLabel="Uppdatera"
                  onSubmit={(name, color) => {
                    onUpdate(project.id, name, color);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {project.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingId(project.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Redigera"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onArchive(project.id, true)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Arkivera"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <polyline points="21 8 21 21 3 21 3 8" />
                      <rect x="1" y="3" width="22" height="5" />
                      <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Archived projects */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Arkiverade ({archived.length})
          </button>
          {showArchived && (
            <div className="space-y-2 mt-2">
              {archived.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 opacity-50"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm text-gray-500 truncate">
                      {project.name}
                    </span>
                  </div>
                  <button
                    onClick={() => onArchive(project.id, false)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1"
                  >
                    Ateraktivera
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
