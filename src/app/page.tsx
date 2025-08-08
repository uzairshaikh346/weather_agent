"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Moon, Sun } from 'lucide-react';

const fastapi = process.env.NEXT_PUBLIC_FASTAPI;

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  isError?: boolean;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI agent. You can ask me anything, including checking weather in different cities. Try typing 'Check weather in Karachi' to see me in action!",
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    if (!fastapi) {
      const errorMessage: Message = {
        id: messages.length + 2,
        text: 'FASTAPI environment variable is not configured. Please set NEXT_PUBLIC_FASTAPI in your environment variables.',
        sender: 'agent',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(fastapi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats from your FastAPI agent
      let responseText;
      if (typeof data === 'string') {
        // If the response is directly a string (result.final_output)
        responseText = data;
      } else if (data.response) {
        responseText = data.response;
      } else if (data.message) {
        responseText = data.message;
      } else if (typeof data === 'object' && data.content) {
        responseText = data.content;
      } else {
        responseText = JSON.stringify(data);
      }
      
      const agentMessage: Message = {
        id: messages.length + 2,
        text: responseText || 'I received your message but couldn\'t generate a proper response.',
        sender: 'agent',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorText: string;
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorText = 'Unable to connect to the AI agent. This might be a CORS issue - the API needs to allow requests from this origin.';
        } else if (error.message.includes('500')) {
          errorText = 'The AI agent encountered an internal error. Please try again.';
        } else if (error.message.includes('404')) {
          errorText = 'API endpoint not found. Please check the URL.';
        } else {
          errorText = `Sorry, I encountered an error: ${error.message}`;
        }
      } else {
        errorText = 'An unknown error occurred.';
      }
      
      const errorMessage: Message = {
        id: messages.length + 2,
        text: errorText,
        sender: 'agent',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = () => {
    setInputMessage('Check weather in Karachi');
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Header */}
      <div className={`shadow-sm border-b p-4 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-slate-800'
              }`}>AI Agent Chat</h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>Powered by FastAPI</p>
            </div>
          </div>
          
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'agent' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : message.isError
                    ? isDarkMode
                      ? 'bg-red-900/50 text-red-200 border border-red-700'
                      : 'bg-red-50 text-red-800 border border-red-200'
                    : isDarkMode
                    ? 'bg-slate-700 text-slate-200 shadow-sm border border-slate-600'
                    : 'bg-white text-slate-800 shadow-sm border border-slate-200'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' 
                    ? 'text-blue-100' 
                    : message.isError 
                    ? isDarkMode ? 'text-red-400' : 'text-red-600'
                    : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className={`shadow-sm border rounded-2xl px-4 py-3 ${
                isDarkMode
                  ? 'bg-slate-700 text-slate-200 border-slate-600'
                  : 'bg-white text-slate-800 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t p-4 ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-4xl mx-auto">
          {/* Example button */}
          <div className="mb-3">
            <button
              onClick={handleExampleClick}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                isDarkMode
                  ? 'bg-amber-900/50 text-amber-300 border-amber-700 hover:bg-amber-800/50'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200 hover:from-amber-100 hover:to-orange-100'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Try: Check weather in Karachi
            </button>
          </div>

          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(e)}
              placeholder="Type your message..."
              className={`flex-1 px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'border-slate-300'
              }`}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          <p className={`text-xs mt-2 text-center ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Connected to: {fastapi || 'Not configured'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;