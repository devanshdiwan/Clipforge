
import React, { useState, useEffect, useCallback } from 'react';
import { Clip, BrandSettings, ChatMessage } from './types';
import { generateClipsFromDescription, continueConversation } from './services/geminiService';
import Upload from './components/Upload';
import Workspace from './components/Workspace';
import ChatBot from './components/ChatBot';
import { MessageSquare } from './components/Icons';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    logo: null,
    accentColor: '#7B61FF',
    font: 'font-poppins',
  });
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Hello! How can I help you today?' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Effect to update CSS variables when accent color changes
  useEffect(() => {
    window.document.documentElement.style.setProperty('--accent-color', brandSettings.accentColor);
    const hoverColor = brandSettings.accentColor + 'B3'; // Add transparency for hover
    window.document.documentElement.style.setProperty('--accent-color-hover', hoverColor);
  }, [brandSettings.accentColor]);

  // Effect to manage the video object URL lifecycle
  useEffect(() => {
    if (!videoFile) {
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);

    // Cleanup function to revoke the object URL when the component unmounts or file changes
    return () => {
      URL.revokeObjectURL(url);
      setVideoUrl(null);
    };
  }, [videoFile]);

  const handleProcessVideo = (file: File, description: string) => {
    setIsLoading(true);
    setError(null);
    setClips([]);
    setVideoFile(file); // This will trigger the useEffect above

    // Generate clips after setting the file
    generateClips(description);
  };

  const generateClips = async (description: string) => {
    try {
      const generatedClips = await generateClipsFromDescription(description);
      setClips(generatedClips);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred while generating clips.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateClip = (index: number, updatedClip: Clip) => {
    setClips(prevClips => {
      const newClips = [...prevClips];
      newClips[index] = updatedClip;
      return newClips;
    });
  };

  const handleStartOver = () => {
    setVideoFile(null);
    setClips([]);
    setError(null);
  };
  
  const handleSendMessage = useCallback(async (message: string) => {
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: message }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      const response = await continueConversation(newMessages, clips);

      if (response.functionCall?.name === 'updateClipDetails') {
        const { clipId, ...updates } = response.functionCall.args;
        if (clipId !== undefined && Object.keys(updates).length > 0) {
          const clipIndex = clips.findIndex(c => c.id === clipId);
          if (clipIndex !== -1) {
            const originalClip = clips[clipIndex];
            const filteredUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
              if (value !== null && value !== undefined) {
                (acc as any)[key] = value;
              }
              return acc;
            }, {} as Partial<Clip>);
            
            const updatedClip = { ...originalClip, ...filteredUpdates };
            updateClip(clipIndex, updatedClip);
          }
        }
      }

      const modelResponseText = response.text || (response.functionCall ? "Done! I've made the changes for you." : null);

      if (modelResponseText) {
        setChatMessages(prev => [...prev, { role: 'model', content: modelResponseText }]);
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Sorry, I encountered an error. Please try again.';
      setChatMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatMessages, clips]);

  const handleRefineClip = (clip: Clip) => {
    handleSendMessage(`Let's refine clip with ID ${clip.id}: "${clip.title}"`);
    setIsChatOpen(true);
  };

  return (
    <div className={`min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300 ${brandSettings.font}`}>
      <div className="container mx-auto p-4 md:p-8">
        {!videoFile || !videoUrl ? (
          <Upload onProcessVideo={handleProcessVideo} isLoading={isLoading} />
        ) : (
          <Workspace
            videoFile={videoFile}
            videoUrl={videoUrl}
            clips={clips}
            onUpdateClip={updateClip}
            brandSettings={brandSettings}
            onUpdateBrandSettings={setBrandSettings}
            onStartOver={handleStartOver}
            isLoading={isLoading}
            error={error}
            onRefineClip={handleRefineClip}
          />
        )}
      </div>

      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-accent text-white p-4 rounded-full shadow-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-transform transform hover:scale-110"
        aria-label="Open chat"
      >
        <MessageSquare />
      </button>

      <ChatBot 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
      />
    </div>
  );
}

export default App;
