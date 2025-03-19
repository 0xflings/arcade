'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PromptInput from '@/components/PromptInput';

// Define the different states of game generation
type GenerationState = 'idle' | 'analyzing' | 'generating-parameters' | 'generating-assets' | 'assembling' | 'saving' | 'error' | 'complete';

export default function CreatePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Handle game generation
  const handleGameGeneration = async (prompt: string, gameConfig: any) => {
    setIsGenerating(true);
    setGenerationState('analyzing');
    setGenerationProgress(10);
    setErrorMessage(null);
    
    try {
      // Determine the author name
      // If gameConfig is a string, it's the old format where username was passed directly
      // Otherwise, extract it from the gameConfig object or use 'Anonymous'
      const userName = typeof gameConfig === 'string' ? gameConfig : 'Anonymous';
      
      // Call the game generation API with the new structure
      const response = await fetch('/api/games/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          userName,
          gameConfig: typeof gameConfig === 'object' ? gameConfig : undefined
        }),
      });
      
      let hasData = false;
      let gameId = null;
      let gameData = null;
      
      // Set up event source for progress updates if supported
      if (response.body && 'getReader' in response.body) {
        const reader = response.body.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Try to parse progress updates
          try {
            const text = new TextDecoder().decode(value);
            const lines = text.trim().split('\n');
            
            for (const line of lines) {
              if (!line.trim()) continue;
              
              try {
                const data = JSON.parse(line);
                
                if (data.state) {
                  setGenerationState(data.state as GenerationState);
                  
                  // If we get an error from the stream, display it immediately
                  if (data.state === 'error' && data.error) {
                    setErrorMessage(data.error);
                  }
                  
                  // If we get a complete signal with gameId or gameData, save it
                  if (data.state === 'complete') {
                    hasData = true;
                    
                    if (data.gameId) {
                      gameId = data.gameId;
                    }
                    
                    // Store the game data even if there's no ID (database save failed)
                    if (data.gameData) {
                      gameData = data.gameData;
                      // Store generated game in session storage as a fallback
                      try {
                        sessionStorage.setItem('tempGameData', JSON.stringify(data.gameData));
                        sessionStorage.setItem('tempGameTitle', data.title || 'Untitled Game');
                      } catch (e) {
                        console.error('Failed to store game in session storage:', e);
                      }
                    }
                  }
                }
                
                if (data.progress !== undefined) {
                  setGenerationProgress(data.progress);
                }
              } catch (parseErr) {
                console.error('Error parsing line:', line, parseErr);
              }
            }
          } catch (e) {
            console.error('Error decoding update:', e);
            // Continue processing in case of parse errors
          }
        }
      }
      
      // Handle errors from the API
      if (!response.ok && !hasData) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        throw new Error(errorData.error || 'Failed to generate game');
      }
      
      // If we have a gameId from the stream, navigate to it
      if (hasData && gameId) {
        setGenerationState('complete');
        setGenerationProgress(100);
        router.push(`/play/${gameId}`);
      } else if (hasData && gameData) {
        // If we have game data but no ID, go to temporary play mode
        setGenerationState('complete');
        setGenerationProgress(100);
        router.push(`/play/temp`);
      } else if (generationState !== 'error') {
        // If we didn't get an error from the stream but also didn't get a gameId or gameData, 
        // something went wrong
        setGenerationState('error');
        setErrorMessage('Game generation completed but no playable game was returned');
      }
    } catch (error: any) {
      console.error('Error generating game:', error);
      setGenerationState('error');
      
      if (error.message && error.message.includes('quota')) {
        setErrorMessage('OpenAI API quota exceeded. Please try again later or contact support.');
      } else {
        setErrorMessage(error.message || 'Failed to generate game. Please try again.');
      }
    } finally {
      // Don't set isGenerating to false for error state so user can see the error
      if (generationState !== 'error') {
        setIsGenerating(false);
      }
    }
  };

  // Helper function to get a descriptive message for each generation state
  const getGenerationStateMessage = () => {
    switch (generationState) {
      case 'analyzing':
        return 'Analyzing your game idea...';
      case 'generating-parameters':
        return 'Designing game mechanics and rules...';
      case 'generating-assets':
        return 'Creating game graphics and sounds...';
      case 'assembling':
        return 'Assembling your game...';
      case 'saving':
        return 'Saving your creation...';
      case 'error':
        return errorMessage || 'An error occurred. Please try again.';
      case 'complete':
        return 'Game created successfully! Redirecting...';
      default:
        return 'Processing your game idea...';
    }
  };

  const resetGeneration = () => {
    setIsGenerating(false);
    setGenerationState('idle');
    setGenerationProgress(0);
    setErrorMessage(null);
  };
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading text-neon-pink neon-text mb-4">Create Your Game</h1>
        <p className="text-lg font-body text-electric-blue">
          Describe your game idea and our AI will make it playable!
        </p>
      </div>
      
      <div className="mb-12">
        <PromptInput 
          onSubmit={handleGameGeneration}
          isLoading={isGenerating}
        />
      </div>
      
      {isGenerating && (
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block relative w-40 h-40">
              <div className="absolute inset-0 border-t-4 border-electric-blue rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-t-4 border-neon-pink rounded-full animate-spin-reverse"></div>
              <div className="absolute inset-8 border-t-4 border-arcade-yellow rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-crt-green font-heading">LOADING</span>
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-heading text-neon-green mb-2">Creating Your Game...</h3>
          <p className="text-crt-green font-body mb-4">
            {getGenerationStateMessage()}
          </p>
          
          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto bg-arcade-black border border-electric-blue rounded-full h-4 mb-6">
            <div 
              className={`h-full rounded-full transition-all duration-300 ease-in-out ${
                generationState === 'error' ? 'bg-red-500' : 'bg-neon-green'
              }`}
              style={{ width: generationState === 'error' ? '100%' : `${generationProgress}%` }}
            ></div>
          </div>
          
          {generationState === 'error' && (
            <div className="mt-4 p-4 bg-red-900 border border-red-500 rounded-lg">
              <p className="text-white text-lg font-bold">Error</p>
              <p className="text-white mb-4">{errorMessage}</p>
              
              {errorMessage && errorMessage.includes('quota') && (
                <div className="mb-4 text-yellow-300 text-sm">
                  <p>The AI service has reached its quota limit. This is a limitation with our current OpenAI integration.</p>
                  <p className="mt-2">Please try again later when the quota resets, or contact support if this issue persists.</p>
                </div>
              )}
              
              <button 
                onClick={resetGeneration}
                className="mt-2 px-4 py-2 bg-arcade-black border border-white rounded-md text-white hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-12 bg-arcade-black border-2 border-metallic-silver rounded-lg p-6">
        <h2 className="text-2xl font-heading text-arcade-yellow mb-4">Tips for Great Game Prompts</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-heading text-electric-blue mb-2">Be Specific</h3>
            <p className="text-crt-green font-body">
              Include details about game type, characters, objectives, and visual style.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-heading text-electric-blue mb-2">Describe Mechanics</h3>
            <p className="text-crt-green font-body">
              Explain how players will interact with the game and what makes it fun.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-heading text-electric-blue mb-2">Set the Theme</h3>
            <p className="text-crt-green font-body">
              Mention the setting, mood, or era that inspires your game.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-heading text-electric-blue mb-2">Mention Inspirations</h3>
            <p className="text-crt-green font-body">
              Reference existing games or genres that are similar to your idea.
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-deep-blue rounded-lg">
          <p className="text-arcade-yellow font-body mb-2 font-bold">Example Prompts:</p>
          <ul className="text-crt-green font-body list-disc pl-6 space-y-2">
            <li>"A platformer game where you play as a time-traveling robot collecting clock parts while avoiding dinosaurs"</li>
            <li>"A puzzle game about connecting colored pipes to direct water flow, with increasing difficulty levels"</li>
            <li>"A top-down shooter with a neon aesthetic where you fight against computer viruses with upgradeable weapons"</li>
          </ul>
        </div>
      </div>
    </main>
  );
} 