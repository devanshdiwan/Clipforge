
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { BotIcon, SendIcon, XIcon } from './Icons';

interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-end justify-end" onClick={onClose}>
            <div
                className="w-full max-w-md h-[70vh] bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl md:mr-6 md:mb-24 shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-in"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent rounded-full text-white">
                            <BotIcon />
                        </div>
                        <h2 className="font-semibold text-lg">ClipForge Assistant</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-full">
                        <XIcon />
                    </button>
                </header>

                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-accent"><BotIcon/></div>}
                                <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                                    msg.role === 'user' 
                                    ? 'bg-accent text-white rounded-br-lg' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'
                                }`}>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-accent"><BotIcon/></div>
                                <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-lg flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-accent rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-accent rounded-full animate-bounce delay-150"></span>
                                    <span className="w-2 h-2 bg-accent rounded-full animate-bounce delay-300"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.currentTarget.value)}
                            placeholder="Ask anything..."
                            className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:ring-2 focus:ring-accent focus:outline-none"
                            disabled={isLoading}
                        />
                        <button type="submit" className="p-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50" disabled={isLoading || !input.trim()}>
                            <SendIcon />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default ChatBot;
