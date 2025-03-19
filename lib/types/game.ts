/**
 * Game configuration and type definitions
 */

/**
 * Game configuration options passed from the UI
 */
export interface GameConfig {
  // Game difficulty level
  difficulty: 'easy' | 'medium' | 'hard';
  // Type of game to generate
  gameType: 'platformer' | 'shooter' | 'puzzle' | 'adventure' | 'racing';
  // Whether to use pixel art style
  pixelArt: boolean;
  // Optional username for game creator
  userName?: string;
}

/**
 * Game metadata stored in the database
 */
export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  prompt: string;
  author_name: string;
  game_config?: GameConfig;
  created_at: string;
  updated_at: string;
  used_fallback?: boolean;
} 