'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GameCard from '@/components/GameCard';

interface Game {
  id: string;
  title: string;
  description: string;
  authorName: string;
}

export default function ExplorePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        
        // Build query params
        const params = new URLSearchParams();
        if (filter === 'featured') {
          params.append('featured', 'true');
        }
        
        const response = await fetch(`/api/games/list?${params.toString()}`);
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load games');
        }
        
        setGames(result.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error loading games:', err);
        setError(err.message || 'Failed to load games');
        setGames([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGames();
  }, [filter]);
  
  // Filter games by search term
  const filteredGames = games.filter(game => 
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    game.authorName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Explore Games</h1>
          <p className="text-gray-300 text-xl">Discover arcade games created by the community</p>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('featured')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'featured'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Featured
              </button>
            </div>
          </div>
        </div>
        
        {/* Game Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-800 text-white p-4 rounded-lg">
            <p className="text-lg font-semibold">Error loading games</p>
            <p>{error}</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold text-gray-300 mb-2">No games found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'Try a different search term or filter.' : 'Be the first to create a game!'}
            </p>
            <Link 
              href="/create" 
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create a Game
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                author={game.authorName}
                rating={0}
                plays={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 