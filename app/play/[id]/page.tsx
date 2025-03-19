'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ArcadeCabinet from '@/components/ArcadeCabinet';
import GameControls from '@/components/GameControls';

export default function PlayGame() {
  const params = useParams();
  const gameId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  
  useEffect(() => {
    async function loadGame() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/games/${gameId}`);
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load game');
        }
        
        setGameData(result.data);
        setError(null);
      } catch (err: any) {
        console.error('Error loading game:', err);
        setError(err.message || 'Failed to load game');
      } finally {
        setLoading(false);
      }
    }
    
    if (gameId) {
      loadGame();
    }
  }, [gameId]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-purple-500 mb-4">Loading Game...</h1>
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error || !gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-white text-xl">{error || 'Game not found'}</p>
          <a href="/" className="mt-6 inline-block bg-purple-600 text-white px-6 py-3 rounded-lg">
            Back to Home
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">{gameData.parameters.world.title}</h1>
          <a href="/" className="bg-purple-600 text-white px-4 py-2 rounded-lg">
            Back to Home
          </a>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <ArcadeCabinet 
                gameData={gameData}
                width={gameData.parameters.world.width || 800}
                height={gameData.parameters.world.height || 600}
                title={gameData.parameters.world.title}
                showControls={true}
              />
            </div>
            
            <div className="w-full md:w-64 bg-gray-700 rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-4">Game Info</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Created by:</span>
                  <span className="text-white ml-2">{gameData.metadata.authorName || 'Anonymous'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Template:</span>
                  <span className="text-white ml-2">{gameData.template}</span>
                </div>
                {gameData.metadata.editCount !== undefined && (
                  <div>
                    <span className="text-gray-400">Edit count:</span>
                    <span className="text-white ml-2">{gameData.metadata.editCount}</span>
                  </div>
                )}
                <div className="pt-4">
                  <h3 className="text-gray-400 mb-2">Description:</h3>
                  <p className="text-white">{gameData.metadata.description || 'No description provided.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 