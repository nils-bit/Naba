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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="space-y-4">
      {/* Active projects */}
      <div className="space-y-2 stagger-children">
        {active.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[var(--text-tertiary)]">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm text-[var(--text-tertiary)]">Inga aktiva projekt</p>
          </div>
        )}
        {active.map((project) => (
          <div key={project.id}>
            {editingId === project.id ? (
              <div className="glass-card p-4">
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
              <div className="flex items-stretch bg-white/72 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-sm hover-lift">
                <div
                  className="w-[4px] shrink-0 rounded-l-2xl"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex items-center justify-between flex-1 px-4 py-3.5">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {project.name}
                  </span>
                  <div className="relative shrink-0 ml-2">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === project.id ? null : project.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-all duration-200"
                      aria-label="Alternativ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    {menuOpenId === project.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white/95 backdrop-blur-2xl border border-black/[0.06] rounded-xl shadow-lg z-20 animate-fade-in overflow-hidden">
                          <button
                            onClick={() => {
                              setEditingId(project.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
                          >
                            Redigera
                          </button>
                          <button
                            onClick={() => {
                              onArchive(project.id, true);
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-red-50 transition-colors duration-150"
                          >
                            Arkivera
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 transition-transform duration-200 ${showArchived ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Arkiverade ({archived.length})
          </button>
          {showArchived && (
            <div className="space-y-2 mt-2 stagger-children">
              {archived.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between bg-black/[0.02] backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-black/[0.04] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-1 h-8 rounded-full shrink-0 opacity-40"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm text-[var(--text-secondary)] truncate">
                      {project.name}
                    </span>
                  </div>
                  <button
                    onClick={() => onArchive(project.id, false)}
                    className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--primary)]/[0.06] transition-all duration-200"
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
