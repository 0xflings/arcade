'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string, options?: any) => void;
  isLoading?: boolean;
  defaultValue?: string;
  maxLength?: number;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

export default function PromptInput({
  onSubmit,
  isLoading = false,
  defaultValue = '',
  maxLength = 200,
  placeholder = 'Enter your game idea...',
  suggestions = [
    'A platformer game about a robot collecting memory chips',
    'A shooter game where you defeat alien invaders',
    'A puzzle game about connecting power sources',
    'An adventure game with a cat exploring a haunted house',
    'A racing game with hovercrafts on an alien planet'
  ],
  className = ''
}: PromptInputProps) {
  const [prompt, setPrompt] = useState(defaultValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedOption, setSelectedOption] = useState({
    difficulty: 'medium',
    gameType: 'platformer',
    pixelArt: true
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Effect to handle clicks outside of suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setPrompt(value);
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle option change
  const handleOptionChange = (key: string, value: any) => {
    setSelectedOption({
      ...selectedOption,
      [key]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim(), selectedOption);
    }
  };
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Prompt Input */}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={handlePromptChange}
              placeholder={placeholder}
              rows={3}
              className="w-full p-4 bg-zinc-800 text-white placeholder-zinc-400 resize-none outline-none"
              disabled={isLoading}
            />
            
            {/* Character Counter */}
            <div className="absolute bottom-2 right-3 text-xs text-zinc-400">
              {prompt.length}/{maxLength}
            </div>
            
            {/* Suggestion Button */}
            <button
              type="button"
              className="absolute top-2 right-3 p-1 text-zinc-400 hover:text-white focus:outline-none transition-colors"
              onClick={() => setShowSuggestions(!showSuggestions)}
              aria-label="Show suggestions"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
          </div>
          
          {/* Game Options */}
          <div className="border-t border-zinc-700 p-4 bg-zinc-800">
            <div className="flex flex-wrap gap-4">
              {/* Difficulty Selection */}
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400 text-sm">Difficulty:</span>
                <div className="flex rounded overflow-hidden">
                  {['easy', 'medium', 'hard'].map(difficulty => (
                    <button
                      key={difficulty}
                      type="button"
                      className={`px-3 py-1 text-xs uppercase ${
                        selectedOption.difficulty === difficulty
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                      onClick={() => handleOptionChange('difficulty', difficulty)}
                      disabled={isLoading}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Game Type Selection */}
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400 text-sm">Type:</span>
                <select
                  value={selectedOption.gameType}
                  onChange={(e) => handleOptionChange('gameType', e.target.value)}
                  className="bg-zinc-700 text-zinc-300 rounded px-3 py-1 text-xs border-none outline-none"
                  disabled={isLoading}
                >
                  <option value="platformer">Platformer</option>
                  <option value="shooter">Shooter</option>
                  <option value="puzzle">Puzzle</option>
                  <option value="adventure">Adventure</option>
                </select>
              </div>
              
              {/* Pixel Art Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400 text-sm">Pixel Art:</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedOption.pixelArt}
                    onChange={(e) => handleOptionChange('pixelArt', e.target.checked)}
                    disabled={isLoading}
                  />
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${
                    selectedOption.pixelArt ? 'bg-purple-600' : 'bg-zinc-600'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      selectedOption.pixelArt ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="bg-zinc-900 p-4 flex justify-end">
            <button
              type="submit"
              className={`px-6 py-2 rounded font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-pink-600 hover:to-purple-700'
              }`}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                'Generate Game'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-10 mt-2 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl">
          <div className="p-2 text-zinc-400 text-xs border-b border-zinc-700">
            Try one of these ideas:
          </div>
          <ul className="py-2 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  className="w-full text-left px-4 py-2 text-zinc-200 hover:bg-zinc-700 focus:outline-none"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 