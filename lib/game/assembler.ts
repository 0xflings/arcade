/**
 * Game assembler for combining templates, parameters, and assets
 */
import { Game, GameTemplate } from '../templates/template';

export class GameAssembler {
  /**
   * Assemble a game by combining template, parameters, and assets
   */
  static assembleGame(template: GameTemplate, parameters: any, assets: any): Game {
    console.log('Assembling game with template:', template.id);
    
    // Create the game instance from the template
    const game = template.createGame(parameters);
    
    // Load the assets into the game
    game.loadAssets(assets);
    
    // Validate the game
    const validationResult = game.validate();
    
    if (!validationResult.valid) {
      console.error('Game validation failed:', validationResult.errors);
      throw new Error(`Game validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    return game;
  }
  
  /**
   * Reassemble a game with modified parameters and/or assets
   */
  static reassembleGame(game: Game, parameters: any, assets: any): Game {
    console.log('Reassembling game');
    
    // Get the template from the original game
    const template = game.getTemplate();
    
    // Create a new game instance with updated parameters
    const updatedGame = template.createGame(parameters);
    
    // Load the updated assets
    updatedGame.loadAssets(assets);
    
    // Preserve the game ID and metadata
    updatedGame.setId(game.getId());
    updatedGame.setMetadata({
      ...game.getMetadata(),
      lastEdited: new Date().toISOString(),
      editCount: (game.getMetadata().editCount || 0) + 1
    });
    
    // Validate the updated game
    const validationResult = updatedGame.validate();
    
    if (!validationResult.valid) {
      console.error('Game validation failed:', validationResult.errors);
      throw new Error(`Game validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    return updatedGame;
  }
} 