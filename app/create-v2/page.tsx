'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type GenerationState = 'idle' | 'generating' | 'error' | 'complete';

export default function CreateV2Page() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gameHtml, setGameHtml] = useState<string | null>(null);
  const [isTweaking, setIsTweaking] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);

  const handleGenerateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerationState('generating');
    setGenerationProgress(10);
    setErrorMessage(null);
    setGameHtml(null);
    setIsTweaking(false);
    setUsedModel(null);

    try {
      const response = await fetch('/api/games/generate-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate game');
      }

      const data = await response.json();
      setGameHtml(data.gameHtml);
      setUsedModel(data.model || null);
      setGenerationState('complete');
      setGenerationProgress(100);

      // Write the generated HTML to the iframe after it has loaded
      setTimeout(() => {
        if (iframeRef.current && data.gameHtml) {
          const iframeDoc = iframeRef.current.contentDocument || 
                           (iframeRef.current.contentWindow?.document);
          
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(data.gameHtml);
            iframeDoc.close();
          }
        }
      }, 100);
    } catch (error: any) {
      console.error('Error generating game:', error);
      setGenerationState('error');
      setErrorMessage(error.message || 'Failed to generate game. Please try again.');
    }
  };

  const handleTweakGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tweakPrompt.trim() || !gameHtml) return;

    setIsTweaking(true);
    setGenerationState('generating');
    setGenerationProgress(30);
    setErrorMessage(null);
    setUsedModel(null);

    try {
      const response = await fetch('/api/games/generate-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: tweakPrompt,
          existingGame: gameHtml
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update game');
      }

      const data = await response.json();
      setGameHtml(data.gameHtml);
      setUsedModel(data.model || null);
      setGenerationState('complete');
      setGenerationProgress(100);
      setTweakPrompt('');

      // Write the updated HTML to the iframe
      setTimeout(() => {
        if (iframeRef.current && data.gameHtml) {
          const iframeDoc = iframeRef.current.contentDocument || 
                           (iframeRef.current.contentWindow?.document);
          
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(data.gameHtml);
            iframeDoc.close();
          }
        }
      }, 100);
    } catch (error: any) {
      console.error('Error updating game:', error);
      setGenerationState('error');
      setErrorMessage(error.message || 'Failed to update game. Please try again.');
    } finally {
      setIsTweaking(false);
    }
  };

  const resetGeneration = () => {
    setGenerationState('idle');
    setGenerationProgress(0);
    setErrorMessage(null);
    setGameHtml(null);
    setPrompt('');
    setTweakPrompt('');
    setIsTweaking(false);
    
    // Clear the iframe content
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || 
                        (iframeRef.current.contentWindow?.document);
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write('');
        iframeDoc.close();
      }
    }
  };

  const getStateMessage = () => {
    switch (generationState) {
      case 'generating':
        return isTweaking ? 'Updating your game...' : 'Creating your game from prompt...';
      case 'error':
        return errorMessage || 'An error occurred. Please try again.';
      case 'complete':
        return 'Game created successfully!';
      default:
        return '';
    }
  };
  
  // Helper function to get the progress bar color
  const getProgressBarColor = () => {
    if (generationState === 'error') return 'bg-red-500';
    return 'bg-neon-green';
  };

  // Render the tweaking form or loading state
  const renderTweakingSection = () => {
    if (generationState === 'generating' && isTweaking) {
      return (
        <div className="text-center py-4">
          <div className="inline-block relative w-16 h-16 mb-2">
            <div className="absolute inset-0 border-t-4 border-electric-blue rounded-full animate-spin"></div>
            <div className="absolute inset-3 border-t-4 border-neon-pink rounded-full animate-spin-reverse"></div>
          </div>
          <p className="text-crt-green font-body mb-4">{getStateMessage()}</p>
          
          <div className="w-full bg-arcade-black border border-electric-blue rounded-full h-4 mb-6">
            <div 
              className="h-full rounded-full transition-all duration-300 ease-in-out bg-neon-green"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
        </div>
      );
    } else {
      return (
        <form onSubmit={handleTweakGame}>
          <div className="mb-4">
            <label htmlFor="tweakPrompt" className="block text-crt-green font-heading mb-2">
              Describe Changes
            </label>
            <textarea
              id="tweakPrompt"
              value={tweakPrompt}
              onChange={(e) => setTweakPrompt(e.target.value)}
              placeholder="Describe what you'd like to change about the current game..."
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-md p-3 h-20"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 bg-purple-600 text-white font-heading rounded-md hover:bg-purple-700 transition-colors"
            disabled={!tweakPrompt.trim()}
          >
            UPDATE GAME
          </button>
        </form>
      );
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading text-neon-pink neon-text mb-4">Create v2</h1>
        <p className="text-lg font-body text-electric-blue">
          Describe any game and get an advanced playable version instantly
        </p>
        <p className="text-sm text-gray-400">Powered by OpenRouter AI with modern libraries</p>
      </div>

      {generationState !== 'complete' && (
        <div className="max-w-2xl mx-auto bg-gray-900 rounded-lg p-6 mb-8 border border-electric-blue">
          <form onSubmit={handleGenerateGame}>
            <div className="mb-4">
              <label htmlFor="prompt" className="block text-crt-green font-heading mb-2">
                Game Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your dream game with as much detail as possible..."
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md p-3 h-32"
                disabled={generationState === 'generating'}
              />
            </div>
            
            {generationState === 'idle' && (
              <button
                type="submit"
                className="w-full py-3 bg-neon-pink text-white font-heading rounded-md hover:bg-pink-700 transition-colors"
                disabled={!prompt.trim()}
              >
                GENERATE GAME
              </button>
            )}
          </form>

          {generationState === 'generating' && !isTweaking && (
            <div className="text-center mt-6">
              <div className="inline-block relative w-24 h-24 mb-4">
                <div className="absolute inset-0 border-t-4 border-electric-blue rounded-full animate-spin"></div>
                <div className="absolute inset-3 border-t-4 border-neon-pink rounded-full animate-spin-reverse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-crt-green font-heading text-sm">LOADING</span>
                </div>
              </div>
              <p className="text-crt-green font-body mb-4">{getStateMessage()}</p>
              
              <div className="w-full bg-arcade-black border border-electric-blue rounded-full h-4 mb-6">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ease-in-out ${getProgressBarColor()}`}
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {generationState === 'error' && (
            <div className="mt-6 p-4 bg-red-900 border border-red-500 rounded-lg">
              <p className="text-white text-lg font-bold">Error</p>
              <p className="text-white mb-4">{errorMessage}</p>
              
              <button 
                onClick={resetGeneration}
                className="px-4 py-2 bg-arcade-black border border-white rounded-md text-white hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {generationState === 'complete' && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-heading text-neon-green">Your Game</h2>
              {usedModel && (
                <p className="text-sm text-gray-400">Generated by: {usedModel}</p>
              )}
            </div>
            <button 
              onClick={resetGeneration}
              className="px-4 py-2 bg-arcade-black border border-electric-blue rounded-md text-white hover:bg-gray-800"
            >
              Create New Game
            </button>
          </div>
          
          <div className="bg-black border-4 border-arcade-yellow rounded-lg p-4 mb-8 aspect-video">
            <iframe
              ref={iframeRef}
              className="w-full h-full bg-white"
              style={{ minHeight: '400px', border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title="Generated Game"
            ></iframe>
          </div>

          {/* Game Tweaking Section */}
          <div className="max-w-2xl mx-auto bg-gray-900 rounded-lg p-6 mt-8 border border-electric-blue">
            <h3 className="text-xl font-heading text-purple-400 mb-4">Tweak Your Game</h3>
            {renderTweakingSection()}
          </div>
        </div>
      )}
    </main>
  );
} 