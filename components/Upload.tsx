
import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles } from './Icons';

interface UploadProps {
  onProcessVideo: (file: File, description: string) => void;
  isLoading: boolean;
}

const Upload: React.FC<UploadProps> = ({ onProcessVideo, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.currentTarget.files?.[0];
    if (selectedFile && (selectedFile.type === 'video/mp4' || selectedFile.type === 'video/quicktime')) {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please upload a valid .mp4 or .mov file.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Please provide a more detailed description (at least 20 characters).');
      return;
    }
    setError('');
    onProcessVideo(file, description);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">ClipForge Lite</h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300">
          Turn any long video into viral shorts — instantly.
        </p>
      </div>

      <div className="mt-10 w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit}>
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-accent dark:hover:border-accent transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="video/mp4,video/quicktime"
            />
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <UploadCloud className="w-12 h-12" />
              {file ? (
                <p className="mt-2 font-semibold text-gray-700 dark:text-gray-200">{file.name}</p>
              ) : (
                <p className="mt-2">Click to upload a video (.mp4, .mov)</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe your video for the AI
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-accent focus:border-accent transition"
              placeholder="e.g., 'A podcast episode about the future of AI, featuring two speakers discussing new models and their impact...'"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />
          </div>

          {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !file || !description}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-accent text-white font-semibold py-3 px-4 rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles />
                <span>Generate Clips</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
