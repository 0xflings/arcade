/**
 * Game loader for deserializing saved games
 */
import { Game } from '../templates/template';
import { GameTemplateManager } from '../templates/template';

export class GameLoader {
  /**
   * Load a game from serialized data
   */
  static loadGame(gameData: any): Game {
    console.log('Loading game from data');
    
    if (!gameData) {
      throw new Error('Game data is null or undefined');
    }
    
    // Get the template
    const templateId = gameData.template;
    const template = GameTemplateManager.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template '${templateId}' not found`);
    }
    
    // Create the game instance
    const game = template.createGame(gameData.parameters);
    
    // Set the ID
    if (gameData.id) {
      game.setId(gameData.id);
    }
    
    // Load assets
    if (gameData.assets) {
      game.loadAssets(gameData.assets);
    }
    
    // Set metadata
    if (gameData.metadata) {
      game.setMetadata(gameData.metadata);
    }
    
    return game;
  }
} 