import { supabase, isSupabaseConfigured } from '../supabase';
// Import templates to ensure registration
import '@/lib/templates';
import { Game } from '../templates/template';
import { GameTemplateManager } from '../templates/template';

export interface GameMetadata {
  title: string;
  description?: string;
  authorName: string;
  parentGameId?: string;
  isFeatured?: boolean;
}

export class GameService {
  /**
   * Save a game to the database
   * @param game The game to save
   * @param metadata Additional metadata for the game
   * @returns The saved game with its new ID
   */
  static async saveGame(game: Game, metadata: GameMetadata): Promise<Game> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not properly configured');
    }
    
    const serializedGame = game.serialize();
    
    // Prepare data for insertion
    const gameData = {
      title: metadata.title,
      description: metadata.description || '',
      prompt: serializedGame.metadata.prompt || '',
      game_data: serializedGame,
      author_name: metadata.authorName,
      parent_game_id: metadata.parentGameId || null,
      is_featured: metadata.isFeatured || false
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('games')
      .insert(gameData)
      .select('id')
      .single();
      
    if (error) {
      console.error('Error saving game:', error);
      throw new Error(`Failed to save game: ${error.message}`);
    }
    
    // Update the game with the new ID
    game.setId(data.id);
    
    return game;
  }
  
  /**
   * Load a game from the database by ID
   * @param id The ID of the game to load
   * @returns The loaded game
   */
  static async loadGame(id: string): Promise<Game> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not properly configured');
    }
    
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error loading game:', error);
      throw new Error(`Failed to load game: ${error.message}`);
    }
    
    if (!data) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    // Reconstruct the game
    return this.deserializeGame(data.game_data);
  }
  
  /**
   * List games with optional filtering
   * @param limit Maximum number of games to return
   * @param authorName Filter by author name
   * @param isFeatured Filter for featured games
   * @returns Array of games
   */
  static async listGames(
    limit: number = 20,
    authorName?: string,
    isFeatured?: boolean
  ): Promise<{id: string, title: string, description: string, authorName: string}[]> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not properly configured');
    }
    
    // Build query
    let query = supabase
      .from('games')
      .select('id, title, description, author_name')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (authorName) {
      query = query.eq('author_name', authorName);
    }
    
    if (isFeatured !== undefined) {
      query = query.eq('is_featured', isFeatured);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error listing games:', error);
      throw new Error(`Failed to list games: ${error.message}`);
    }
    
    // Transform results
    return data.map(game => ({
      id: game.id,
      title: game.title,
      description: game.description,
      authorName: game.author_name
    }));
  }
  
  /**
   * Update an existing game
   * @param id The ID of the game to update
   * @param game The updated game
   * @param metadata Updated metadata
   * @returns The updated game
   */
  static async updateGame(id: string, game: Game, metadata: Partial<GameMetadata>): Promise<Game> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not properly configured');
    }
    
    const serializedGame = game.serialize();
    
    // Update the edit count in metadata
    const currentMetadata = game.getMetadata();
    const editCount = (currentMetadata.editCount || 0) + 1;
    game.setMetadata({ ...currentMetadata, editCount });
    
    // Prepare data for update
    const gameData: any = {
      game_data: serializedGame,
      updated_at: new Date().toISOString()
    };
    
    // Add optional fields if provided
    if (metadata.title) gameData.title = metadata.title;
    if (metadata.description !== undefined) gameData.description = metadata.description;
    if (metadata.authorName) gameData.author_name = metadata.authorName;
    if (metadata.isFeatured !== undefined) gameData.is_featured = metadata.isFeatured;
    
    // Update in Supabase
    const { error } = await supabase
      .from('games')
      .update(gameData)
      .eq('id', id);
      
    if (error) {
      console.error('Error updating game:', error);
      throw new Error(`Failed to update game: ${error.message}`);
    }
    
    return game;
  }
  
  /**
   * Delete a game from the database
   * @param id The ID of the game to delete
   * @returns Whether the deletion was successful
   */
  static async deleteGame(id: string): Promise<boolean> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not properly configured');
    }
    
    // Delete from Supabase
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting game:', error);
      throw new Error(`Failed to delete game: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Private helper to reconstruct a game from serialized data
   */
  private static deserializeGame(serializedGame: any): Game {
    // Get the template
    const template = GameTemplateManager.getTemplateById(serializedGame.template);
    
    if (!template) {
      throw new Error(`Template ${serializedGame.template} not found`);
    }
    
    // Create a new game instance
    const game = template.createGame(serializedGame.parameters);
    
    // Restore ID and metadata
    game.setId(serializedGame.id);
    game.setMetadata(serializedGame.metadata);
    
    // Load assets if available
    if (serializedGame.assets) {
      game.loadAssets(serializedGame.assets);
    }
    
    return game;
  }
} 