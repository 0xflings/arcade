'use client';

import React from 'react';
import Link from 'next/link';

interface GameCardProps {
  id: string;
  title: string;
  author: string;
  rating?: number;
  plays?: number;
  thumbnailUrl?: string;
}

export default function GameCard({
  id,
  title,
  author,
  rating = 0,
  plays = 0,
  thumbnailUrl,
}: GameCardProps) {
  // Generate star rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-arcade-yellow">★</span>
      );
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-arcade-yellow">★</span>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-metallic-silver">★</span>
      );
    }
    
    return stars;
  };
  
  return (
    <Link href={`/play/${id}`} className="block">
      <div className="game-card bg-arcade-black border-2 border-metallic-silver rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105 hover:border-neon-pink">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-deep-blue">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl text-neon-pink">🎮</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-arcade-black to-transparent opacity-50"></div>
        </div>
        
        {/* Title and author */}
        <div className="p-3 border-b border-deep-blue">
          <h3 className="text-lg font-heading text-electric-blue truncate">{title}</h3>
          <p className="text-sm font-ui text-metallic-silver">by {author}</p>
        </div>
        
        {/* Stats */}
        <div className="p-3 flex justify-between items-center">
          <div className="text-sm">{renderStars()}</div>
          <div className="text-sm font-ui text-crt-green">{plays} Plays</div>
        </div>
      </div>
    </Link>
  );
} 