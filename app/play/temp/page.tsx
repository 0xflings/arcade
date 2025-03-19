'use client';

import { useEffect, useState } from 'react';
import ArcadeCabinet from '@/components/ArcadeCabinet';

export default function TempPlayGame() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [gameTitle, setGameTitle] = useState<string>('Untitled Game');
  
  useEffect(() => {
    // Load game data from session storage
    try {
      const tempGameData = sessionStorage.getItem('tempGameData');
      const tempGameTitle = sessionStorage.getItem('tempGameTitle');
      
      if (!tempGameData) {
        throw new Error('No temporary game data found');
      }
      
      setGameData(JSON.parse(tempGameData));
      
      if (tempGameTitle) {
        setGameTitle(tempGameTitle);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading temp game:', err);
      setError(err.message || 'Failed to load temporary game');
    } finally {
      setLoading(false);
    }
  }, []);
  
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
          <h1 className="text-3xl font-bold text-white">
            {gameData.parameters?.world?.title || gameTitle}
            <span className="ml-3 text-sm bg-yellow-600 text-white px-2 py-1 rounded">Temporary Game</span>
          </h1>
          <a href="/" className="bg-purple-600 text-white px-4 py-2 rounded-lg">
            Back to Home
          </a>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <ArcadeCabinet 
                gameData={gameData}
                width={gameData.parameters?.world?.width || 800}
                height={gameData.parameters?.world?.height || 600}
                title={gameData.parameters?.world?.title || gameTitle}
                showControls={true}
              />
            </div>
            
            <div className="w-full md:w-64 bg-gray-700 rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-4">Game Info</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Template:</span>
                  <span className="text-white ml-2">{gameData.template || 'Unknown'}</span>
                </div>
                <div className="pt-4">
                  <h3 className="text-gray-400 mb-2">Note:</h3>
                  <p className="text-white">This is a temporary game that couldn't be saved to the database. It will be lost if you refresh the page or navigate away.</p>
                </div>
                <div className="pt-4">
                  <button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                      // Implement save functionality in the future
                      alert('Save functionality coming soon!');
                    }}
                  >
                    Save Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 