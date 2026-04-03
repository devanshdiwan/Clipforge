
import React, { useState, useEffect } from 'react';
import { Clip, BrandSettings } from '../types';
import ClipCard from './ClipCard';
import SettingsPanel from './SettingsPanel';
import { Download, Sparkles } from './Icons';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { loadFFmpeg } from '../services/ffmpegService';

interface WorkspaceProps {
  videoFile: File;
  videoUrl: string;
  clips: Clip[];
  onUpdateClip: (index: number, updatedClip: Clip) => void;
  brandSettings: BrandSettings;
  onUpdateBrandSettings: (settings: BrandSettings) => void;
  onStartOver: () => void;
  isLoading: boolean;
  error: string | null;
  onRefineClip: (clip: Clip) => void;
}

const ExportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-auto">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Shorts are ready!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                Video export is a simulation in this demo. You can download the generated clip data as a text file.
            </p>
            <div className="mt-6 space-y-3">
                <button className="w-full bg-accent text-white font-semibold py-3 px-4 rounded-lg hover:bg-accent-hover transition">
                    Download All (Simulated)
                </button>
                <button onClick={onClose} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Close
                </button>
            </div>
        </div>
    </div>
);

const Workspace: React.FC<WorkspaceProps> = ({
  videoFile,
  videoUrl,
  clips,
  onUpdateClip,
  brandSettings,
  onUpdateBrandSettings,
  onStartOver,
  isLoading,
  error,
  onRefineClip,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [isFfmpegLoading, setIsFfmpegLoading] = useState(true);
  const [ffmpegError, setFfmpegError] = useState<string | null>(null);

  useEffect(() => {
    async function initFFmpeg() {
      try {
        const ffmpegInstance = await loadFFmpeg();
        setFfmpeg(ffmpegInstance);
      } catch (e) {
        console.error("Failed to load ffmpeg", e);
        setFfmpegError(e instanceof Error ? e.message : "Failed to load video engine. Previews will be unavailable.");
      } finally {
        setIsFfmpegLoading(false);
      }
    }
    initFFmpeg();
  }, []);
  
  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Workspace</h1>
        <div>
            <button
                onClick={() => setShowExportModal(true)}
                className="bg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-accent-hover transition mr-4 inline-flex items-center gap-2"
            >
                <Download />
                Export All
            </button>
            <button
                onClick={onStartOver}
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
                Start Over
            </button>
        </div>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Original Video</h2>
            <video src={videoUrl} controls className="w-full rounded-lg"></video>
          </div>
          <SettingsPanel settings={brandSettings} onUpdate={onUpdateBrandSettings} />
        </div>
        <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Generated Clips</h2>
            {isFfmpegLoading && (
                <div className="flex flex-col items-center justify-center h-48 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg font-semibold">Loading Video Engine...</p>
                    <p className="text-gray-500">This happens once per session.</p>
                </div>
            )}
            {ffmpegError && !isFfmpegLoading && (
                <div className="flex flex-col items-center justify-center h-48 bg-red-100 dark:bg-red-900/50 rounded-2xl p-4 text-center border border-red-200 dark:border-red-800 mb-6">
                    <h3 className="font-bold text-red-700 dark:text-red-200">Video Engine Failed to Load</h3>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-300">{ffmpegError}</p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">You can still edit clip details, but video previews cannot be generated.</p>
                </div>
            )}
            {isLoading && !isFfmpegLoading && (
                 <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <Sparkles className="w-12 h-12 text-accent animate-pulse" />
                    <p className="mt-4 text-lg font-semibold">AI is crafting your clips...</p>
                    <p className="text-gray-500">This might take a moment.</p>
                </div>
            )}
            {error && <div className="p-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}
            
            {!isLoading && !error && (
                <div className="space-y-6">
                {clips.map((clip, index) => (
                    <ClipCard
                    key={`${clip.id}-${index}`}
                    clip={clip}
                    brandSettings={brandSettings}
                    onUpdate={(updatedClip) => onUpdateClip(index, updatedClip)}
                    videoFile={videoFile}
                    ffmpeg={ffmpeg}
                    isFfmpegReady={!!ffmpeg && !ffmpegError}
                    onRefine={onRefineClip}
                    />
                ))}
                </div>
            )}
        </div>
      </main>
      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
    </div>
  );
};

export default Workspace;
