import { AIService, AIServiceError } from '@/lib/services/ai';
// Import the templates index to ensure all templates are registered
import '@/lib/templates';
import { GameTemplateManager } from '@/lib/templates/template';
import { GameAssembler } from '@/lib/game/assembler';
import { AssetGenerator } from '@/lib/game/assets';
import { supabase } from '@/lib/supabase';
import { GameConfig } from '@/lib/types/game';

// Validate gameConfig input
function validateGameConfig(config: any): GameConfig {
  // Default values
  const validatedConfig: GameConfig = {
    difficulty: 'medium',
    gameType: 'platformer',
    pixelArt: true
  };
  
  if (!config) return validatedConfig;
  
  // Validate difficulty
  if (config.difficulty && ['easy', 'medium', 'hard'].includes(config.difficulty)) {
    validatedConfig.difficulty = config.difficulty;
  }
  
  // Validate gameType
  if (config.gameType && ['platformer', 'shooter', 'puzzle', 'adventure', 'racing'].includes(config.gameType)) {
    validatedConfig.gameType = config.gameType;
  }
  
  // Validate pixelArt (boolean)
  if (typeof config.pixelArt === 'boolean') {
    validatedConfig.pixelArt = config.pixelArt;
  }
  
  return validatedConfig;
}

// Fallback functions for when the AI service fails
function generateFallbackAnalysis(prompt: string) {
  // Extract potential game title and genre from the prompt
  let title = 'Arcade Game';
  if (prompt.length > 10) {
    title = prompt.split(' ').slice(0, 3).join(' ');
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  const genres = ['platformer', 'shooter', 'puzzle', 'racing', 'adventure'];
  let genre = 'platformer';
  for (const g of genres) {
    if (prompt.toLowerCase().includes(g)) {
      genre = g;
      break;
    }
  }
  
  return {
    title,
    genre,
    mechanics: [],
    visualStyle: 'pixel',
    characters: [],
    objectives: [],
  };
}

export async function POST(request: Request) {
  // Create a TransformStream for sending progress updates
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  let writerClosed = false;

  const sendUpdate = async (state: string, progress: number, data?: any) => {
    if (writerClosed) return;
    
    try {
      const update = {
        state,
        progress,
        ...data
      };
      await writer.write(encoder.encode(JSON.stringify(update) + '\n'));
    } catch (error) {
      console.error('Error sending update:', error);
      // Ignore write errors as they may occur if the stream is closed
    }
  };

  const closeWriter = async () => {
    if (!writerClosed) {
      try {
        writerClosed = true;
        await writer.close();
      } catch (error) {
        console.error('Error closing stream writer:', error);
        // Ignore close errors
      }
    }
  };

  // Process the game generation in the background and stream updates
  const processRequest = async () => {
    let usedFallback = false;
    
    try {
      const { prompt, userName, gameConfig: rawGameConfig } = await request.json();
      
      // Validate the game configuration
      const gameConfig = validateGameConfig(rawGameConfig);
      
      // Log the received and validated data for debugging
      console.log('Received game generation request:', { prompt, userName });
      console.log('Using validated gameConfig:', gameConfig);
      
      // Analyze prompt
      await sendUpdate('analyzing', 10, { message: 'Analyzing your game prompt...' });
      let analysis;
      try {
        analysis = await AIService.analyzePrompt(prompt);
        
        // Apply gameConfig settings to analysis
        if (gameConfig) {
          // Update visual style based on pixelArt setting
          analysis.visualStyle = gameConfig.pixelArt ? 'pixel' : 'modern';
          
          // Update genre based on gameType setting
          analysis.genre = gameConfig.gameType;
        }
      } catch (error: any) {
        if (error instanceof AIServiceError && error.code === 'insufficient_quota') {
          await sendUpdate('error', 0, { 
            error: error.message,
            errorCode: error.code
          });
          await closeWriter();
          return;
        }
        
        // For other errors, use a fallback but continue
        console.warn('Using fallback analysis due to error:', error);
        analysis = generateFallbackAnalysis(prompt);
        usedFallback = true;
        await sendUpdate('analyzing', 15, { 
          message: 'AI service unavailable, using simplified analysis...',
          warning: 'Using fallback game analysis'
        });
      }
      
      // Select template
      await sendUpdate('analyzing', 20, { message: 'Selecting game template...' });
      // Use gameType from gameConfig
      const template = GameTemplateManager.selectTemplate({...analysis, genre: gameConfig.gameType});
      
      if (!template) {
        await sendUpdate('error', 0, { error: 'No suitable game template found' });
        await closeWriter();
        return;
      }
      
      // Generate parameters
      await sendUpdate('generating-parameters', 30, { message: 'Designing game mechanics...' });
      let parameters;
      try {
        parameters = await AIService.generateGameParameters(analysis, template);
        
        // Apply gameConfig settings to parameters
        if (parameters.difficulty) {
          parameters.difficulty = gameConfig.difficulty;
        }
        
        // Other gameConfig integrations
        if (parameters.player && gameConfig.difficulty === 'easy') {
          // Make player stronger in easy mode
          if (parameters.player.health) parameters.player.health *= 1.5;
          if (parameters.player.speed) parameters.player.speed *= 1.2;
        } else if (parameters.player && gameConfig.difficulty === 'hard') {
          // Make player weaker in hard mode
          if (parameters.player.health) parameters.player.health *= 0.7;
        }
      } catch (error: any) {
        if (error instanceof AIServiceError && error.code === 'insufficient_quota') {
          await sendUpdate('error', 0, { 
            error: error.message,
            errorCode: error.code
          });
          await closeWriter();
          return;
        }
        
        // For other errors, use a fallback but continue
        console.warn('Using default parameters due to error:', error);
        parameters = template.getDefaultParameters();
        usedFallback = true;
        await sendUpdate('generating-parameters', 35, { 
          message: 'AI service unavailable, using default game mechanics...',
          warning: 'Using default game parameters'
        });
      }
      
      // Generate assets
      await sendUpdate('generating-assets', 50, { message: 'Creating game assets...' });
      // Pass the game configuration to the asset generator
      const assets = await AssetGenerator.generateAssets(analysis, parameters, gameConfig);
      
      // Assemble game
      await sendUpdate('assembling', 70, { message: 'Assembling your game...' });
      const game = GameAssembler.assembleGame(template, parameters, assets);
      
      // Save to database
      await sendUpdate('saving', 90, { message: 'Saving your game...' });
      try {
        const { data, error } = await supabase.from('games').insert({
          title: analysis.title || 'Untitled Game',
          description: prompt,
          prompt: prompt,
          game_data: game.serialize(),
          author_name: userName || 'Anonymous',
          game_config: gameConfig,
          used_fallback: usedFallback
        }).select('id').single();
        
        if (error) throw error;
        
        await sendUpdate('complete', 100, { 
          success: true,
          gameId: data.id,
          gameData: game.serialize(),
          title: analysis.title,
          usedFallback
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        
        // Return the game even if saving fails
        await sendUpdate('complete', 100, {
          success: true,
          gameId: null, // No ID since saving failed
          gameData: game.serialize(),
          title: analysis.title,
          warning: 'Game was generated but could not be saved to the database',
          usedFallback
        });
      }
    } catch (error: any) {
      console.error('Game generation failed:', error);
      
      // Extract the meaningful error message, including OpenAI quota errors
      let errorMessage = 'Failed to generate game';
      let errorCode = 'unknown_error';
      
      if (error instanceof AIServiceError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error.message) {
        errorMessage = error.message;
        errorCode = error.code || 'unknown_error';
      }
      
      // Special handling for common API errors
      if (errorCode === 'insufficient_quota' || 
          (error.message && error.message.includes('exceeded your current quota'))) {
        errorMessage = 'OpenAI API quota exceeded. Please try again later or check your billing details.';
        errorCode = 'insufficient_quota';
      }
      
      await sendUpdate('error', 0, { 
        error: errorMessage,
        errorCode
      });
    } finally {
      await closeWriter();
    }
  };

  // Start the processing in the background
  processRequest();

  // Return the stream immediately
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    },
  });
} 