import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { EditorView } from './components/Editor/EditorView';
import { AccountView } from './components/AccountView';
import { AdminView } from './components/AdminView';
import { LoginModal } from './components/LoginModal';
import { UpgradeModal } from './components/UpgradeModal';
import { CaptionProject } from './types';

function AppContent() {
  const { user, isAuthModalOpen, setIsAuthModalOpen, isUpgradeModalOpen, setIsUpgradeModalOpen, showToast } = useAuth();
  const [currentTab, setCurrentTab] = useState<'landing' | 'dashboard' | 'editor' | 'account' | 'admin'>('landing');
  const [activeProject, setActiveProject] = useState<CaptionProject | null>(null);

  // Handle opening an existing project by ID
  const handleOpenProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'x-user-id': user?.id || 'demo-user',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data.project);
        setCurrentTab('editor');
      } else {
        showToast('Failed to load project');
      }
    } catch (err) {
      showToast('Error connecting to project server');
    }
  };

  // Handle uploading a new video file to start a fresh project
  const handleStartEditorWithFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const newProject: CaptionProject = {
      id: 'proj-' + Date.now(),
      user_id: user?.id || 'demo-user',
      title: file.name.replace(/\.[^/.]+$/, ''),
      video_url: objectUrl,
      video_name: file.name,
      duration: 15,
      status: 'ready',
      template_id: 'tpl_002',
      animation_style: 'pop_bounce',
      frame: '9:16',
      position: 'bottom',
      text_case: 'uppercase',
      font_family: 'Montserrat',
      font_size: 7,
      font_weight: 800,
      text_color: '#FFFFFF',
      highlight_color: '#FF007F',
      captions: [
        {
          id: 'cap-initial-1',
          idx: 1,
          start_time: 0.5,
          end_time: 3.2,
          text: 'Welcome to CAPTIVOX burner studio',
          words: [
            { text: 'Welcome', start: 0.5, end: 1.1 },
            { text: 'to', start: 1.1, end: 1.4 },
            { text: 'CAPTIVOX', start: 1.4, end: 2.2 },
            { text: 'burner', start: 2.2, end: 2.7 },
            { text: 'studio', start: 2.7, end: 3.2 },
          ],
        },
        {
          id: 'cap-initial-2',
          idx: 2,
          start_time: 3.4,
          end_time: 6.5,
          text: 'Auto-transcribe or edit your subtitles',
          words: [
            { text: 'Auto-transcribe', start: 3.4, end: 4.4 },
            { text: 'or', start: 4.4, end: 4.7 },
            { text: 'edit', start: 4.7, end: 5.2 },
            { text: 'your', start: 5.2, end: 5.6 },
            { text: 'subtitles', start: 5.6, end: 6.5 },
          ],
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActiveProject(newProject);
    setCurrentTab('editor');
    showToast(`Loaded ${file.name} into Subtitle Studio`);
  };

  // Open Sample Project directly
  const handleOpenSampleProject = (sampleId: string) => {
    handleOpenProject(sampleId);
  };

  // Handle loading a .captivox.json file
  const handleLoadProjectJson = (project: CaptionProject) => {
    setActiveProject(project);
    setCurrentTab('editor');
  };

  // New Project button click
  const handleNewProjectClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/mp4,video/quicktime,video/webm,video/x-matroska';
    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        handleStartEditorWithFile(file);
      }
    };
    fileInput.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {currentTab !== 'editor' && (
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onNewProjectClick={handleNewProjectClick}
        />
      )}

      <main className="flex-1 flex flex-col">
        {currentTab === 'landing' && (
          <LandingPage
            onStartEditorWithFile={handleStartEditorWithFile}
            onOpenSampleProject={handleOpenSampleProject}
            onNavigateToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            onOpenProject={handleOpenProject}
            onNewProjectClick={handleNewProjectClick}
            onLoadProjectJson={handleLoadProjectJson}
          />
        )}

        {currentTab === 'editor' && activeProject && (
          <EditorView
            initialProject={activeProject}
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onLoadExternalProject={handleLoadProjectJson}
          />
        )}

        {currentTab === 'account' && (
          <AccountView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'admin' && (
          <AdminView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}
      </main>

      <LoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
