'use client'
import React, { useEffect, useState } from 'react';

interface GameControlsProps {
  onDirectionPress?: (direction: 'up' | 'down' | 'left' | 'right' | null) => void;
  onActionPress?: (action: 'jump' | 'attack' | 'special' | 'pause', pressed: boolean) => void;
  showPauseButton?: boolean;
  showActionButtons?: boolean;
  numActionButtons?: 1 | 2 | 3;
  actionButtonLabels?: string[];
  className?: string;
  visible?: boolean;
}

export default function GameControls({
  onDirectionPress,
  onActionPress,
  showPauseButton = true,
  showActionButtons = true,
  numActionButtons = 2,
  actionButtonLabels = ['A', 'B', 'C'],
  className = '',
  visible = true
}: GameControlsProps) {
  const [activeDirections, setActiveDirections] = useState<Set<string>>(new Set());
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check if device supports touch
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Don't render controls if not on a touch device or not visible
  if (!isTouchDevice || !visible) {
    return null;
  }

  // Handle D-pad press
  const handleDirectionPress = (direction: 'up' | 'down' | 'left' | 'right' | null, pressed: boolean) => {
    if (!onDirectionPress) return;
    
    const newActiveDirections = new Set(activeDirections);
    
    if (pressed) {
      if (direction) newActiveDirections.add(direction);
    } else {
      if (direction) newActiveDirections.delete(direction);
    }
    
    setActiveDirections(newActiveDirections);
    
    // Only send the most recently pressed direction
    if (newActiveDirections.size === 0) {
      onDirectionPress(null);
    } else {
      const lastDirection = Array.from(newActiveDirections).pop() as 'up' | 'down' | 'left' | 'right';
      onDirectionPress(lastDirection);
    }
  };

  // Handle action button press
  const handleActionPress = (action: 'jump' | 'attack' | 'special' | 'pause', pressed: boolean) => {
    if (!onActionPress) return;
    
    const newActiveActions = new Set(activeActions);
    
    if (pressed) {
      newActiveActions.add(action);
    } else {
      newActiveActions.delete(action);
    }
    
    setActiveActions(newActiveActions);
    onActionPress(action, pressed);
  };

  // Map action index to action type
  const getActionType = (index: number): 'jump' | 'attack' | 'special' => {
    switch (index) {
      case 0: return 'jump';
      case 1: return 'attack';
      case 2: return 'special';
      default: return 'jump';
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200 ${className}`}>
      <div className="flex justify-between items-end p-4 max-w-6xl mx-auto">
        {/* D-Pad Controls */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute w-full h-full grid grid-cols-3 grid-rows-3">
            {/* Top left (empty) */}
            <div></div>
            
            {/* Up button */}
            <div 
              className={`flex items-center justify-center ${activeDirections.has('up') ? 'bg-purple-700' : 'bg-purple-900'} bg-opacity-80 active:bg-purple-700 border-t-2 border-l-2 border-r-2 border-purple-600 rounded-t-md`}
              onTouchStart={() => handleDirectionPress('up', true)}
              onTouchEnd={() => handleDirectionPress('up', false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Top right (empty) */}
            <div></div>
            
            {/* Left button */}
            <div 
              className={`flex items-center justify-center ${activeDirections.has('left') ? 'bg-purple-700' : 'bg-purple-900'} bg-opacity-80 active:bg-purple-700 border-l-2 border-t-2 border-b-2 border-purple-600 rounded-l-md`}
              onTouchStart={() => handleDirectionPress('left', true)}
              onTouchEnd={() => handleDirectionPress('left', false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Center (D-pad center) */}
            <div className="bg-purple-800 bg-opacity-80 border border-purple-600"></div>
            
            {/* Right button */}
            <div 
              className={`flex items-center justify-center ${activeDirections.has('right') ? 'bg-purple-700' : 'bg-purple-900'} bg-opacity-80 active:bg-purple-700 border-r-2 border-t-2 border-b-2 border-purple-600 rounded-r-md`}
              onTouchStart={() => handleDirectionPress('right', true)}
              onTouchEnd={() => handleDirectionPress('right', false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Bottom left (empty) */}
            <div></div>
            
            {/* Down button */}
            <div 
              className={`flex items-center justify-center ${activeDirections.has('down') ? 'bg-purple-700' : 'bg-purple-900'} bg-opacity-80 active:bg-purple-700 border-b-2 border-l-2 border-r-2 border-purple-600 rounded-b-md`}
              onTouchStart={() => handleDirectionPress('down', true)}
              onTouchEnd={() => handleDirectionPress('down', false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Bottom right (empty) */}
            <div></div>
          </div>
        </div>
        
        {/* Action Buttons */}
        {showActionButtons && (
          <div className="flex space-x-4 mb-4">
            {[...Array(numActionButtons)].map((_, index) => (
              <button
                key={index}
                className={`w-16 h-16 rounded-full ${
                  activeActions.has(getActionType(index)) 
                    ? 'bg-pink-600' 
                    : 'bg-pink-700'
                } bg-opacity-80 border-2 border-pink-500 text-white font-bold text-xl shadow-lg flex items-center justify-center`}
                onTouchStart={() => handleActionPress(getActionType(index), true)}
                onTouchEnd={() => handleActionPress(getActionType(index), false)}
              >
                {actionButtonLabels[index]}
              </button>
            ))}
            
            {/* Pause Button */}
            {showPauseButton && (
              <button
                className="w-12 h-12 rounded-full bg-gray-800 bg-opacity-80 border-2 border-gray-600 text-white font-bold text-xs shadow-lg flex items-center justify-center"
                onTouchStart={() => handleActionPress('pause', true)}
                onTouchEnd={() => handleActionPress('pause', false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 