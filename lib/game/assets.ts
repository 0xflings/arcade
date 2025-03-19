/**
 * Asset generator for game visuals and audio
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define cache directory and ensure it exists
const CACHE_DIR = path.join(process.cwd(), 'public', 'assets', 'cache');

// Create the cache directory structure if it doesn't exist
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create asset cache directory:', error);
}

export class AssetGenerator {
  // In-memory cache for the current session
  private static memoryCache: Record<string, string> = {};

  /**
   * Generate all assets for a game based on analysis and parameters
   */
  static async generateAssets(analysis: any, parameters: any, gameConfig?: any) {
    console.log('Generating assets for game');
    
    // Generate all asset types
    const sprites = await this.generateSprites(analysis, parameters, gameConfig);
    const backgrounds = await this.generateBackgrounds(analysis, parameters, gameConfig);
    const audioEffects = await this.generateAudioEffects(analysis, parameters);
    const music = await this.generateMusic(analysis, parameters);
    
    return {
      sprites,
      backgrounds,
      audioEffects,
      music
    };
  }
  
  /**
   * Generate sprite assets
   */
  static async generateSprites(analysis: any, parameters: any, gameConfig?: any) {
    console.log('Generating sprites');
    
    try {
      // Apply gameConfig to sprite generation if available
      const pixelArtStyle = gameConfig?.pixelArt !== false;
      
      // Generate player sprite
      const playerDescription = this.createSpritePrompt('player', analysis, parameters, gameConfig);
      const playerSprite = await this.generateImage(playerDescription, 256, 256, pixelArtStyle);
      
      // Generate enemy sprites
      const enemies = [];
      if (parameters.enemies && parameters.enemies.types) {
        for (const enemyType of parameters.enemies.types) {
          const enemyDescription = this.createSpritePrompt('enemy', analysis, parameters, gameConfig, enemyType);
          const enemySprite = await this.generateImage(enemyDescription, 256, 256, pixelArtStyle);
          enemies.push(enemySprite);
        }
      } else {
        // Generate a default enemy if none specified
        const enemyDescription = this.createSpritePrompt('enemy', analysis, parameters, gameConfig);
        const enemySprite = await this.generateImage(enemyDescription, 256, 256, pixelArtStyle);
        enemies.push(enemySprite);
      }
      
      // Generate collectible sprites
      const collectibles = [];
      if (parameters.collectibles && parameters.collectibles.types) {
        for (const collectibleType of parameters.collectibles.types) {
          const collectibleDescription = this.createSpritePrompt('collectible', analysis, parameters, gameConfig, collectibleType);
          const collectibleSprite = await this.generateImage(collectibleDescription, 256, 256, pixelArtStyle);
          collectibles.push(collectibleSprite);
        }
      } else {
        // Generate a default collectible if none specified
        const collectibleDescription = this.createSpritePrompt('collectible', analysis, parameters, gameConfig);
        const collectibleSprite = await this.generateImage(collectibleDescription, 256, 256, pixelArtStyle);
        collectibles.push(collectibleSprite);
      }
      
      return {
        player: playerSprite,
        enemies,
        collectibles
      };
    } catch (error) {
      console.error('Error generating sprites with AI:', error);
      // Fall back to placeholder sprites if AI generation fails
      return {
        player: this.getPlaceholderSprite('player', parameters.player?.color || '#FF00FF'),
        enemies: [
          this.getPlaceholderSprite('enemy', '#FF0000')
        ],
        collectibles: [
          this.getPlaceholderSprite('coin', '#FFFF00')
        ]
      };
    }
  }
  
  /**
   * Generate background assets
   */
  static async generateBackgrounds(analysis: any, parameters: any, gameConfig?: any) {
    console.log('Generating backgrounds');
    
    try {
      // Apply gameConfig to background generation if available
      const pixelArtStyle = gameConfig?.pixelArt !== false;
      
      // Generate main background
      const backgroundDescription = this.createBackgroundPrompt(analysis, parameters, gameConfig);
      const backgroundImage = await this.generateImage(backgroundDescription, 1024, 512, pixelArtStyle);
      
      return {
        main: backgroundImage
      };
    } catch (error) {
      console.error('Error generating backgrounds with AI:', error);
      // Fall back to placeholder background if AI generation fails
      return {
        main: this.getPlaceholderBackground(parameters.world?.width || 800, parameters.world?.height || 600)
      };
    }
  }
  
  /**
   * Generate audio effect assets
   */
  static async generateAudioEffects(analysis: any, parameters: any) {
    console.log('Generating audio effects');
    
    // For now, return placeholder audio effects
    // In the future, this could use AI audio generation
    return {
      jump: '/assets/placeholder-jump.mp3',
      collect: '/assets/placeholder-collect.mp3',
      hit: '/assets/placeholder-hit.mp3'
    };
  }
  
  /**
   * Generate music assets
   */
  static async generateMusic(analysis: any, parameters: any) {
    console.log('Generating music');
    
    // For now, return placeholder music
    // In the future, this could use AI music generation
    return {
      main: '/assets/placeholder-music.mp3'
    };
  }
  
  /**
   * Modify assets for an existing game based on edit analysis
   */
  static async modifyAssets(game: any, analysis: any) {
    console.log('Modifying assets');
    
    const currentAssets = game.getAssets();
    const newAssets: any = {};
    
    // Only regenerate assets that need to change
    if (analysis.needsNewSprites) {
      newAssets.sprites = await this.generateSprites(analysis, game.getParameters());
    }
    
    if (analysis.needsNewBackgrounds) {
      newAssets.backgrounds = await this.generateBackgrounds(analysis, game.getParameters());
    }
    
    // Merge with current assets
    return {
      ...currentAssets,
      ...newAssets
    };
  }
  
  /**
   * Generate an image using OpenAI's DALL-E with caching
   */
  private static async generateImage(prompt: string, width: number, height: number, pixelArt: boolean = true): Promise<string> {
    // Create a hash of the prompt and dimensions for the cache key
    const cacheKey = this.getCacheKey(prompt, width, height, pixelArt);
    
    // Check memory cache first (fastest)
    if (this.memoryCache[cacheKey]) {
      console.log('Asset found in memory cache:', cacheKey);
      return this.memoryCache[cacheKey];
    }
    
    // Check disk cache next
    const cachedAssetPath = this.getCachedAssetPath(cacheKey);
    if (fs.existsSync(cachedAssetPath)) {
      console.log('Asset found in disk cache:', cacheKey);
      const publicPath = this.getPublicCachePath(cacheKey);
      this.memoryCache[cacheKey] = publicPath; // Store in memory cache too
      return publicPath;
    }
    
    try {
      // Ensure the prompt asks for appropriate art style
      const artStylePrompt = pixelArt 
        ? `Pixel art style. ${prompt}. Single sprite on transparent background.`
        : `Modern game style. ${prompt}. Clean vector art on transparent background.`;
      
      // Use standard DALL-E size options (must be one of the allowed sizes)
      // For DALL-E-3, the only supported size is 1024x1024 (square)
      // For DALL-E-2, we can use different sizes
      const model = "dall-e-2"; // Changed from dall-e-3 to dall-e-2
      let size: "256x256" | "512x512" | "1024x1024" = "256x256";
      
      if (width > 256 || height > 256) {
        size = "512x512";
      }
      
      if (width > 512 || height > 512) {
        size = "1024x1024";
      }
      
      console.log('Generating new image with DALL-E:', prompt.substring(0, 50) + '...');
      const response = await openai.images.generate({
        model: model,
        prompt: artStylePrompt,
        n: 1,
        size: size,
        response_format: "url"
      });
      
      // Get the image URL
      const imageUrl = response.data[0]?.url || '';
      
      if (!imageUrl) {
        throw new Error("Empty URL from DALL-E");
      }
      
      // Download and save image to cache
      await this.downloadAndCacheImage(imageUrl, cacheKey);
      
      // Return the public path to the cached image
      const publicPath = this.getPublicCachePath(cacheKey);
      this.memoryCache[cacheKey] = publicPath; // Store in memory cache
      return publicPath;
    } catch (error) {
      console.error('Error generating image with DALL-E:', error);
      throw error;
    }
  }
  
  /**
   * Generate a cache key from the prompt and dimensions
   */
  private static getCacheKey(prompt: string, width: number, height: number, pixelArt: boolean = true): string {
    const hash = crypto.createHash('md5').update(`${prompt}-${width}x${height}-${pixelArt ? 'pixel' : 'modern'}`).digest('hex');
    return hash;
  }
  
  /**
   * Get the file system path for a cached asset
   */
  private static getCachedAssetPath(cacheKey: string): string {
    return path.join(CACHE_DIR, `${cacheKey}.png`);
  }
  
  /**
   * Get the public URL path for a cached asset
   */
  private static getPublicCachePath(cacheKey: string): string {
    return `/assets/cache/${cacheKey}.png`;
  }
  
  /**
   * Download an image from URL and save to the cache
   */
  private static async downloadAndCacheImage(url: string, cacheKey: string): Promise<void> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const filePath = this.getCachedAssetPath(cacheKey);
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log('Image cached successfully:', filePath);
    } catch (error) {
      console.error('Error downloading and caching image:', error);
      throw error;
    }
  }
  
  /**
   * Create prompt for sprite generation
   */
  private static createSpritePrompt(type: string, analysis: any, parameters: any, gameConfig?: any, specificType?: string): string {
    let prompt = '';
    
    // Determine art style from gameConfig or analysis
    const artStyle = gameConfig?.pixelArt !== false ? 'pixel art' : (analysis.visualStyle || 'modern');
    
    // Determine game genre from gameConfig or analysis
    const genre = gameConfig?.gameType || analysis.genre || 'platformer';
    
    // Apply difficulty to character descriptions
    const difficulty = gameConfig?.difficulty || 'medium';
    let difficultyModifier = '';
    
    if (difficulty === 'easy') {
      difficultyModifier = 'friendly and approachable';
    } else if (difficulty === 'hard') {
      difficultyModifier = 'challenging and formidable';
    }
    
    switch (type) {
      case 'player':
        prompt = `A ${artStyle} game character for a ${genre} game. `;
        
        if (difficultyModifier) {
          prompt += `The character should look ${difficultyModifier}. `;
        }
        
        if (analysis.characters && analysis.characters.length > 0) {
          prompt += `The character should be ${analysis.characters[0]}. `;
        }
        
        if (parameters.player?.description) {
          prompt += parameters.player.description;
        }
        break;
        
      case 'enemy':
        prompt = `A ${artStyle} enemy for a ${genre} game. `;
        
        if (difficultyModifier) {
          prompt += `The enemy should look ${difficultyModifier}. `;
        }
        
        if (specificType) {
          prompt += `The enemy should be a ${specificType}. `;
        } else if (analysis.characters && analysis.characters.length > 1) {
          prompt += `The enemy should be ${analysis.characters[1]}. `;
        } else {
          prompt += 'The enemy should be menacing but simple. ';
        }
        break;
        
      case 'collectible':
        prompt = `A ${artStyle} collectible item for a ${genre} game. `;
        
        if (specificType) {
          prompt += `The collectible should be a ${specificType}. `;
        } else {
          prompt += 'The collectible should be shiny and attractive. ';
        }
        break;
        
      default:
        prompt = `A ${artStyle} game sprite.`;
    }
    
    return prompt;
  }
  
  /**
   * Create prompt for background generation
   */
  private static createBackgroundPrompt(analysis: any, parameters: any, gameConfig?: any): string {
    // Determine art style from gameConfig or analysis
    const artStyle = gameConfig?.pixelArt !== false ? 'pixel art' : (analysis.visualStyle || 'modern');
    
    // Determine game genre from gameConfig or analysis
    const genre = gameConfig?.gameType || analysis.genre || 'platformer';
    
    // Apply difficulty to background
    const difficulty = gameConfig?.difficulty || 'medium';
    let difficultyModifier = '';
    
    if (difficulty === 'easy') {
      difficultyModifier = 'bright and cheerful';
    } else if (difficulty === 'hard') {
      difficultyModifier = 'challenging and intense';
    } else {
      difficultyModifier = 'balanced and engaging';
    }
    
    let prompt = `A ${artStyle} background for a ${genre} game with a ${difficultyModifier} atmosphere. `;
    
    if (parameters.world?.theme) {
      prompt += `The theme is ${parameters.world.theme}. `;
    } else if (analysis.mechanics && analysis.mechanics.length > 0) {
      prompt += `It should complement gameplay focused on ${analysis.mechanics.join(', ')}. `;
    }
    
    if (parameters.world?.description) {
      prompt += parameters.world.description;
    }
    
    return prompt;
  }
  
  /**
   * Generate a placeholder sprite data URI
   */
  private static getPlaceholderSprite(type: string, color: string) {
    // Create a simple SVG for the sprite
    const size = 32;
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${color}" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10">${type}</text>
      </svg>
    `;
    
    // Convert to data URI
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  
  /**
   * Generate a placeholder background data URI
   */
  private static getPlaceholderBackground(width: number, height: number) {
    // Create a simple SVG for the background
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#000033;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#330033;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)" />
        <g fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.2">
          <path d="M0 ${height / 2} L${width} ${height / 2}" />
          <path d="M${width / 2} 0 L${width / 2} ${height}" />
        </g>
      </svg>
    `;
    
    // Convert to data URI
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
} 