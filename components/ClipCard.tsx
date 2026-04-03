
import React, { useState, useEffect } from 'react';
import { Clip, BrandSettings } from '../types';
import { Download, Sparkles } from './Icons';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { processClip } from '../services/ffmpegService';

interface ClipCardProps {
  clip: Clip;
  brandSettings: BrandSettings;
  onUpdate: (updatedClip: Clip) => void;
  videoFile: File;
  ffmpeg: FFmpeg | null;
  isFfmpegReady: boolean;
  onRefine: (clip: Clip) => void;
}

const ClipCard: React.FC<ClipCardProps> = ({ clip, brandSettings, onUpdate, videoFile, ffmpeg, isFfmpegReady, onRefine }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableCaption, setEditableCaption] = useState(clip.caption);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When the clip data is updated externally (e.g., by AI), reset the preview.
    setEditableCaption(clip.caption);
    setProcessedUrl(null);
    setError(null);
  }, [clip]);

  // Effect to clean up the object URL and prevent memory leaks
  useEffect(() => {
    return () => {
      if (processedUrl) {
        URL.revokeObjectURL(processedUrl);
      }
    };
  }, [processedUrl]);

  const handleSave = () => {
    onUpdate({ ...clip, caption: editableCaption });
    setIsEditing(false);
  };
  
  const handleGeneratePreview = async () => {
    if (!ffmpeg || !isFfmpegReady) {
      setError("Video engine is not ready. Please wait or reload.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    try {
      const currentClip = { ...clip, caption: editableCaption };
      const url = await processClip(ffmpeg, videoFile, currentClip, brandSettings, (p) => setProgress(p));
      setProcessedUrl(url);
    } catch (e) {
      console.error("Failed to process clip", e);
      setError(e instanceof Error ? e.message : "An error occurred during video processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-in flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-48 h-64 bg-gray-900 rounded-lg flex-shrink-0 relative overflow-hidden">
        {processedUrl ? (
          <video src={processedUrl} controls className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-4 text-center">
            {isProcessing ? (
              <>
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white font-mono text-sm mt-4">Processing... {progress > 0 && progress < 100 ? `${progress}%` : ''}</p>
              </>
            ) : (
              <>
                <span className="text-white font-mono text-sm">
                  Generate a preview for {clip.start}s - {clip.end}s
                </span>
                <button
                    onClick={handleGeneratePreview}
                    disabled={!isFfmpegReady || isEditing}
                    className="mt-4 flex items-center gap-2 bg-accent text-white font-semibold py-2 px-3 rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                    <Sparkles />
                    Generate Preview
                </button>
                {isEditing && <p className="text-xs text-yellow-400 mt-2">Save caption before generating.</p>}
              </>
            )}
            {error && <p className="text-red-400 text-xs mt-2 p-2 bg-red-900/50 rounded">{error}</p>}
          </div>
        )}
      </div>
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{clip.title}</h3>
            <a 
                href={processedUrl!} 
                download={`clip-${clip.id}.mp4`}
                className={`p-1 -mt-1 -mr-1 ${!processedUrl ? 'pointer-events-none opacity-50 text-gray-500' : 'text-gray-500 hover:text-accent'}`}
                aria-disabled={!processedUrl}
                onClick={(e) => !processedUrl && e.preventDefault()}
            >
                <Download/>
            </a>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Hook: "{clip.hook}"</p>
        
        <div className="flex-grow mt-2">
            <label className="text-sm font-medium">Caption</label>
            {isEditing ? (
                 <textarea
                    value={editableCaption}
                    onChange={(e) => setEditableCaption(e.currentTarget.value)}
                    className="w-full p-2 mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-accent focus:border-accent text-sm h-24"
                />
            ) : (
                <p className="mt-1 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm">{clip.caption}</p>
            )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-4">
            {isEditing ? (
                 <button onClick={handleSave} className="text-sm font-semibold text-accent hover:underline">Save</button>
            ) : (
                <>
                    <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-gray-500 hover:text-accent">Edit</button>
                    <button 
                        onClick={() => onRefine(clip)} 
                        className="text-sm font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                        <Sparkles className="w-4 h-4" />
                        Refine
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClipCard;
