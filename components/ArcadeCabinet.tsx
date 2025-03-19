'use client';

import React, { ReactNode, useState } from 'react';
import GameCanvas from './GameCanvas';

interface ArcadeCabinetProps {
  gameData: any;
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  onGameStart?: () => void;
  onGameEnd?: () => void;
  showControls?: boolean;
  muted?: boolean;
  onMuteToggle?: (muted: boolean) => void;
}

export default function ArcadeCabinet({
  gameData,
  width = 800,
  height = 600,
  className = '',
  title = 'ARCADE',
  onGameStart,
  onGameEnd,
  showControls = true,
  muted = false,
  onMuteToggle
}: ArcadeCabinetProps) {
  const [isMuted, setIsMuted] = useState(muted);
  
  // Calculate cabinet dimensions
  const cabinetWidth = width + 80;  // 40px padding on each side
  const cabinetHeight = height + 140;  // 100px top, 40px bottom
  
  // Handle mute toggle
  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (onMuteToggle) {
      onMuteToggle(newMutedState);
    }
  };
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: cabinetWidth, 
        height: cabinetHeight,
        margin: '0 auto'
      }}
    >
      {/* Arcade Cabinet Frame */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-lg overflow-hidden shadow-2xl"
        style={{ 
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), inset 0 2px 5px rgba(255, 255, 255, 0.1)' 
        }}
      >
        {/* Cabinet Top Panel with Title */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-zinc-800 border-b border-zinc-700 flex items-center justify-center">
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-arcade text-3xl tracking-wider">
            {title}
          </div>
        </div>
        
        {/* Screen Bezel */}
        <div 
          className="absolute bg-zinc-950 rounded-md"
          style={{ 
            top: '100px', 
            left: '40px', 
            width: width, 
            height: height,
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8)' 
          }}
        >
          {/* Game Canvas */}
          <GameCanvas 
            gameData={gameData} 
            width={width} 
            height={height}
            onGameStart={onGameStart}
            onGameEnd={onGameEnd}
          />
          
          {/* Scanlines Effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 255, 255, 0.1) 1px, rgba(255, 255, 255, 0.1) 2px)',
              backgroundSize: '100% 4px'
            }}
          ></div>
          
          {/* Screen Glare Effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'linear-gradient(130deg, rgba(255, 255, 255, 0.3) 0%, transparent 30%, transparent 70%, rgba(255, 255, 255, 0.2) 100%)'
            }}
          ></div>
        </div>
        
        {/* Control Panel */}
        {showControls && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-800 border-t border-zinc-700 flex items-center justify-between px-8"
          >
            {/* Mute Button */}
            <button 
              className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center focus:outline-none hover:bg-zinc-600 transition-colors"
              onClick={handleMuteToggle}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            
            {/* Controls Help */}
            <div className="text-zinc-400 text-xs">
              <span className="inline-block px-2 py-1 bg-zinc-700 rounded mr-1">WASD</span> or 
              <span className="inline-block px-2 py-1 bg-zinc-700 rounded mx-1">←↑↓→</span> to move &nbsp;
              <span className="inline-block px-2 py-1 bg-zinc-700 rounded mx-1">SPACE</span> to jump
            </div>
            
            {/* Instructions Button */}
            <button 
              className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center focus:outline-none hover:bg-zinc-600 transition-colors"
              aria-label="Help"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute -left-3 top-1/4 w-6 h-20 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-l-md"></div>
      <div className="absolute -right-3 top-1/4 w-6 h-20 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-r-md"></div>
    </div>
  );
} 