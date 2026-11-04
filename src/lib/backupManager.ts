import { CaptionProject } from '../types';

export interface ProjectBackupSnapshot {
  id: string;
  projectId: string;
  timestamp: number;
  dateFormatted: string;
  captionCount: number;
  templateId: string;
  title: string;
  projectData: CaptionProject;
}

const MAX_HISTORY_VERSIONS = 10;

/**
 * Saves a versioned snapshot of the project into the history stack (up to 10 versions).
 */
export function saveProjectSnapshot(project: CaptionProject): ProjectBackupSnapshot[] {
  if (!project || !project.id) return [];

  const key = `captivox_history_${project.id}`;
  let history: ProjectBackupSnapshot[] = [];

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      history = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse history from localStorage', e);
    history = [];
  }

  const now = Date.now();
  const dateFormatted = new Date(now).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const snapshot: ProjectBackupSnapshot = {
    id: `snap_${now}_${Math.random().toString(36).substring(2, 6)}`,
    projectId: project.id,
    timestamp: now,
    dateFormatted,
    captionCount: project.captions?.length || 0,
    templateId: project.template_id,
    title: project.title,
    projectData: JSON.parse(JSON.stringify(project)),
  };

  // Prepend newest version
  history.unshift(snapshot);

  // Keep max 10
  if (history.length > MAX_HISTORY_VERSIONS) {
    history = history.slice(0, MAX_HISTORY_VERSIONS);
  }

  try {
    localStorage.setItem(key, JSON.stringify(history));
    // Also save current project working state
    localStorage.setItem(`captivox_project_${project.id}`, JSON.stringify(project));
  } catch (e) {
    console.warn('LocalStorage quota limit reached for snapshots', e);
  }

  return history;
}

/**
 * Retrieves the history snapshots for a project
 */
export function getProjectHistory(projectId: string): ProjectBackupSnapshot[] {
  if (!projectId) return [];
  const key = `captivox_history_${projectId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Restores a specific snapshot from history
 */
export function restoreProjectSnapshot(
  projectId: string,
  snapshotId: string
): CaptionProject | null {
  const history = getProjectHistory(projectId);
  const found = history.find((h) => h.id === snapshotId);
  if (!found) return null;
  return found.projectData;
}

/**
 * Generates and triggers download of a full .captivox.json project backup
 */
export function downloadProjectBackupFile(project: CaptionProject): void {
  const backupObject = {
    version: '2.0.0',
    app: 'CAPTIVOX Subtitle Editor',
    exportedAt: new Date().toISOString(),
    project,
  };

  const jsonStr = JSON.stringify(backupObject, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = (project.title || 'captivox_project').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${cleanTitle}.captivox.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Parses an uploaded .captivox.json file and returns the validated project
 */
export function parseUploadedBackupJson(jsonString: string): CaptionProject {
  const parsed = JSON.parse(jsonString);
  if (parsed.project && parsed.project.id) {
    return parsed.project;
  }
  if (parsed.id && (parsed.captions !== undefined || parsed.template_id !== undefined)) {
    return parsed as CaptionProject;
  }
  throw new Error('Invalid Captivox backup format. Missing project identifier.');
}
