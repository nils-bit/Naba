export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  user_id: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  tag: string | null;
  note: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface TimeEntryWithProject extends TimeEntry {
  projects: Pick<Project, 'name' | 'color'>;
}
