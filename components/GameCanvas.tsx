'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/lib/engine/core';
import { InputManager } from '@/lib/engine/input';

interface GameCanvasProps {
  gameData: any;
  width?: number;
  height?: number;
  className?: string;
  onGameStart?: () => void;
  onGameEnd?: () => void;
}

export default function GameCanvas({
  gameData,
  width = 800,
  height = 600,
  className = '',
  onGameStart,
  onGameEnd
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize game engine when component mounts or gameData changes
  useEffect(() => {
    if (!canvasRef.current || !gameData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Clean up any existing engine
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      
      // Create new engine instance
      const engine = new GameEngine(gameData);
      engineRef.current = engine;
      
      // Initialize engine with canvas
      engine.initialize(canvasRef.current, {
        onStart: () => {
          setIsLoading(false);
          if (onGameStart) onGameStart();
        },
        onStop: () => {
          if (onGameEnd) onGameEnd();
        }
      });
      
      // Add virtual buttons for touch devices if needed
      const inputManager = engine.getInputManager();
      if (inputManager && 'ontouchstart' in window) {
        // Left button
        inputManager.addVirtualButton({
          x: 20,
          y: height - 100,
          width: 60,
          height: 60,
          color: '#333333',
          pressedColor: '#555555',
          label: '←',
          action: 'left',
          pressed: false
        });
        
        // Right button
        inputManager.addVirtualButton({
          x: 100,
          y: height - 100,
          width: 60,
          height: 60,
          color: '#333333',
          pressedColor: '#555555',
          label: '→',
          action: 'right',
          pressed: false
        });
        
        // Jump button
        inputManager.addVirtualButton({
          x: width - 80,
          y: height - 100,
          width: 60,
          height: 60,
          color: '#FF00FF',
          pressedColor: '#CC00CC',
          label: 'Jump',
          action: 'jump',
          pressed: false
        });
      }
      
      // Start the game engine
      engine.start();
    } catch (err) {
      console.error('Failed to initialize game engine:', err);
      setError('Failed to initialize game. Please try again.');
      setIsLoading(false);
    }
    
    // Clean up on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [gameData, width, height, onGameStart, onGameEnd]);
  
  return (
    <div
      className={`relative arcade-cabinet ${className}`}
      style={{ width, height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading game...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-center p-4 bg-red-900 rounded-lg">
            <p className="text-white text-xl mb-4">Error</p>
            <p className="text-white">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600"
              onClick={() => {
                if (engineRef.current) {
                  try {
                    engineRef.current.dispose();
                    engineRef.current.initialize(canvasRef.current!, {
                      onStart: () => {
                        setIsLoading(false);
                        if (onGameStart) onGameStart();
                      }
                    });
                    engineRef.current.start();
                    setError(null);
                  } catch (err) {
                    console.error('Failed to restart game engine:', err);
                  }
                }
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block bg-black"
      />
    </div>
  );
} 