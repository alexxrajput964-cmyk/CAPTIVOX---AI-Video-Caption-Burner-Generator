import React, { useState, useEffect, useRef } from 'react';
import { CaptionProject } from '../../types';
import {
  getProjectHistory,
  restoreProjectSnapshot,
  downloadProjectBackupFile,
  parseUploadedBackupJson,
  ProjectBackupSnapshot,
} from '../../lib/backupManager';
import {
  X,
  History,
  RotateCcw,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';

interface BackupHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CaptionProject;
  onRestoreProject: (restoredProject: CaptionProject) => void;
  showToast: (msg: string) => void;
}

export const BackupHistoryModal: React.FC<BackupHistoryModalProps> = ({
  isOpen,
  onClose,
  project,
  onRestoreProject,
  showToast,
}) => {
  const [historyList, setHistoryList] = useState<ProjectBackupSnapshot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && project.id) {
      const items = getProjectHistory(project.id);
      setHistoryList(items);
    }
  }, [isOpen, project.id]);

  if (!isOpen) return null;

  const handleRestore = (snapshotId: string) => {
    const restored = restoreProjectSnapshot(project.id, snapshotId);
    if (restored) {
      onRestoreProject(restored);
      showToast('🔄 Restored project to selected version!');
      onClose();
    } else {
      showToast('Could not find snapshot');
    }
  };

  const handleDownloadBackup = () => {
    downloadProjectBackupFile(project);
    showToast('💾 Downloaded full .captivox.json backup');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const restored = parseUploadedBackupJson(text);
        onRestoreProject(restored);
        showToast('✅ Successfully imported and restored .captivox.json backup!');
        onClose();
      } catch (err: any) {
        showToast('Failed to import backup: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#121217] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#17171e] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff8c1a] to-[#ff3d5a] flex items-center justify-center text-white shadow-md">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Project History & Backup Engine</h3>
              <p className="text-[11px] text-neutral-400">
                Automatic 3-second snapshots (last 10 versions) and .captivox.json
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Download & Upload Backup */}
        <div className="p-4 bg-[#141419] border-b border-neutral-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            title="Save full project to offline file"
          >
            <Download className="w-3.5 h-3.5 text-[#ff8c1a]" />
            <span>Download .captivox.json</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.captivox.json"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            title="Import an existing .captivox.json file"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import Backup</span>
          </button>
        </div>

        {/* History List */}
        <div className="p-5 overflow-y-auto space-y-2.5">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1 mb-1">
            <span className="font-semibold text-neutral-300">Auto-Saved Version History:</span>
            <span>{historyList.length} of 10 kept</span>
          </div>

          {historyList.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-xs bg-black/30 rounded-xl border border-neutral-800">
              No previous version snapshots saved yet for this session.
            </div>
          ) : (
            historyList.map((snap, idx) => (
              <div
                key={snap.id}
                className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-neutral-800 hover:border-neutral-700 text-xs transition-colors"
              >
                <div className="space-y-0.5 truncate max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-200 font-bold">
                      {snap.dateFormatted}
                    </span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    <span>{snap.captionCount} subtitles · Template: {snap.templateId}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestore(snap.id)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#ff8c1a]" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#17171e] border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Edits are automatically safeguarded against browser crashes</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
