import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CaptionProject } from '../types';
import { TIER_LIMITS } from '../lib/templates';
import {
  Plus,
  Play,
  Upload,
  Clock,
  Sparkles,
  Trash2,
  FolderOpen,
  Crown,
  FileCode,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface DashboardProps {
  onOpenProject: (projectId: string) => void;
  onNewProjectClick: () => void;
  onLoadProjectJson: (project: CaptionProject) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenProject,
  onNewProjectClick,
  onLoadProjectJson,
}) => {
  const { user, setIsUpgradeModalOpen, showToast } = useAuth();
  const [projects, setProjects] = useState<CaptionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects', {
        headers: { 'x-user-id': user?.id || 'demo-user' },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.warn('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this caption project?')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || 'demo-user' },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        showToast('Project deleted successfully');
      }
    } catch (err) {
      showToast('Failed to delete project');
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.captions && parsed.title) {
          onLoadProjectJson(parsed);
          showToast('Project restored from .captivox.json');
        } else {
          showToast('Invalid .captivox.json file');
        }
      } catch (err) {
        showToast('Error reading project file');
      }
    };
    reader.readAsText(file);
  };

  const userTierLimit = TIER_LIMITS[user?.tier || 'free'];
  const remainingExports = Math.max(0, userTierLimit.dailyExports - (user?.exports_today || 0));

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-white py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Greeting & Quota Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-neutral-900">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white">
              Namaste, {user?.full_name?.split(' ')[0] || 'Creator'} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
              100% Free Forever
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Captivox by Vineet Rajput — Unlimited subtitle burning, zero watermarks, 41 templates & 1-click MP4 downloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Daily Quota Card */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-neutral-900/90 border border-emerald-500/30 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Founder Community License
              </div>
              <div className="font-semibold text-white">
                <span className="text-[#ff8c1a] font-bold">Unlimited Access</span> · Free Forever
              </div>
            </div>
          </div>

          {/* Load .captivox.json */}
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,.captivox.json"
            className="hidden"
            onChange={handleJsonUpload}
          />
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-neutral-400" />
            Load .captivox.json
          </button>

          {/* New Project Primary CTA */}
          <button
            onClick={onNewProjectClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white text-xs font-semibold flex items-center gap-2 hover:opacity-95 shadow-md shadow-[#ff3d5a]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Video Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-outfit text-white">Recent Projects</h2>
            <span className="text-xs text-neutral-400 font-mono">({projects.length})</span>
          </div>

          <div className="text-xs text-neutral-400">
            Autosaved to cloud · Real-time karaoke sync
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-neutral-900/60 border border-neutral-800 animate-pulse"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-[#121214] border border-neutral-800">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 mx-auto flex items-center justify-center text-neutral-400 mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-white text-base">No video projects yet</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Upload a video to transcribe speech into synchronized karaoke captions and burn them directly into MP4.
            </p>
            <button
              onClick={onNewProjectClick}
              className="mt-5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white text-xs font-semibold inline-flex items-center gap-2 hover:opacity-95"
            >
              <Plus className="w-4 h-4" />
              Create First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj.id)}
                className="group relative rounded-2xl bg-[#141416] border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* Thumbnail Preview Area */}
                <div className="relative h-44 bg-neutral-900 overflow-hidden flex items-center justify-center">
                  {proj.video_url ? (
                    <video
                      src={proj.video_url}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <div className="text-neutral-600 text-xs flex flex-col items-center gap-1">
                      <Play className="w-8 h-8 opacity-40" />
                      <span>No Video Track</span>
                    </div>
                  )}

                  {/* Frame Ratio Badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                    {proj.frame || '9:16'}
                  </div>

                  {/* Template Badge */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-[#ff8c1a]/20 backdrop-blur-md text-[10px] font-medium text-[#ff8c1a] border border-[#ff8c1a]/30">
                    {proj.template_id}
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold font-outfit text-white text-base group-hover:text-[#ff8c1a] transition-colors truncate">
                      {proj.title}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteProject(proj.id, e)}
                      className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{Math.round(proj.duration || 10)}s</span>
                      <span>·</span>
                      <span>{proj.captions?.length || 0} segments</span>
                    </div>

                    <span className="text-[11px] text-neutral-500">
                      {new Date(proj.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* First Caption Sample */}
                  {proj.captions && proj.captions[0] && (
                    <div className="mt-3 p-2 rounded-lg bg-neutral-900/80 border border-neutral-800/80 text-[11px] text-neutral-300 italic truncate">
                      "{proj.captions[0].text}"
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-semibold text-[#ff8c1a]">
                    <span>Open in Subtitle Studio</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
