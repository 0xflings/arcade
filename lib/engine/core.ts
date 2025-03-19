/**
 * Core game engine with main game loop
 */

import { Entity } from './entity';
import { Renderer, RenderOptions } from './renderer';
import { Physics } from './physics';
import { Scene, SceneOptions } from './scene';
import { InputManager } from './input';
import { SoundManager } from './sound';
import { AssetManager, AssetOptions, AssetType } from './asset';

export interface EngineOptions {
  onUpdate?: (deltaTime: number) => void;
  onRender?: (ctx: CanvasRenderingContext2D) => void;
  onStart?: () => void;
  onStop?: () => void;
  physics?: Partial<{
    gravity: number;
    friction: number;
    terminalVelocity: number;
  }>;
  renderer?: Partial<RenderOptions>;
  assetBaseUrl?: string;
}

export class GameEngine {
  // Core components
  private renderer: Renderer | null = null;
  private inputManager: InputManager | null = null;
  private soundManager: SoundManager | null = null;
  private assetManager: AssetManager | null = null;
  
  // Game state
  private gameData: any;
  private running: boolean = false;
  private lastFrameTime: number = 0;
  private canvas: HTMLCanvasElement | null = null;
  private scenes: Map<string, Scene> = new Map();
  private activeScene: Scene | null = null;
  
  // Event callbacks
  private onUpdate: ((deltaTime: number) => void) | null = null;
  private onRender: ((ctx: CanvasRenderingContext2D) => void) | null = null;
  private onStart: (() => void) | null = null;
  private onStop: (() => void) | null = null;
  
  // Additional properties
  private currentLevelIndex: number = 0;
  private score: number = 0;
  private collectedItems: number = 0;
  private totalCollectibles: number = 0;
  private gameCompleted: boolean = false;
  private levelTransitioning: boolean = false;
  
  constructor(gameData: any) {
    this.gameData = gameData;
    
    // Initialize sound manager
    this.soundManager = new SoundManager();
    
    // Initialize asset manager
    this.assetManager = new AssetManager();
  }
  
  /**
   * Initialize the game engine with a canvas element
   */
  initialize(canvas: HTMLCanvasElement, options: EngineOptions = {}): void {
    console.log('Initializing game engine');
    
    this.canvas = canvas;
    
    // Get game dimensions
    const width = this.gameData.parameters?.world?.width || 800;
    const height = this.gameData.parameters?.world?.height || 600;
    
    // Initialize renderer
    this.renderer = new Renderer(canvas, {
      width,
      height,
      backgroundColor: this.gameData.parameters?.world?.backgroundColor || '#000033',
      ...options.renderer
    });
    
    // Initialize input manager
    this.inputManager = new InputManager(canvas);
    
    // Set asset base URL if provided
    if (options.assetBaseUrl && this.assetManager) {
      this.assetManager.setBaseUrl(options.assetBaseUrl);
    }
    
    // Set callbacks
    this.onUpdate = options.onUpdate || null;
    this.onRender = options.onRender || null;
    this.onStart = options.onStart || null;
    this.onStop = options.onStop || null;
    
    // Create default scene
    this.createScene('default', {
      name: 'default',
      gravity: this.gameData.parameters?.world?.gravity || 0.5,
      friction: this.gameData.parameters?.world?.friction || 0.8,
      backgroundColor: this.gameData.parameters?.world?.backgroundColor || '#000033'
    });
    
    this.setActiveScene('default');
    
    // Preload assets
    this.preloadAssets();
    
    // Preload audio assets
    this.preloadAudioAssets();
    
    // Initialize entities
    this.initializeEntities();
  }
  
  /**
   * Preload game assets
   */
  private async preloadAssets(): Promise<void> {
    if (!this.assetManager) return;
    
    const assetsToLoad: { id: string; url: string; options?: AssetOptions }[] = [];
    
    // Handle generated game assets format with sprites
    if (this.gameData.assets?.sprites) {
      console.log('Loading generated game assets');
      const sprites = this.gameData.assets.sprites;
      
      // Load player sprite
      if (sprites.player) {
        assetsToLoad.push({
          id: 'player',
          url: sprites.player,
          options: { type: 'image' as AssetType }
        });
      }
      
      // Load enemy sprites
      if (sprites.enemies && Array.isArray(sprites.enemies)) {
        sprites.enemies.forEach((url: string, index: number) => {
          assetsToLoad.push({
            id: `enemy_${index}`,
            url,
            options: { type: 'image' as AssetType }
          });
        });
      }
      
      // Load collectible sprites
      if (sprites.collectibles && Array.isArray(sprites.collectibles)) {
        sprites.collectibles.forEach((url: string, index: number) => {
          assetsToLoad.push({
            id: `collectible_${index}`,
            url,
            options: { type: 'image' as AssetType }
          });
        });
      }
      
      // Load background
      if (this.gameData.assets.backgrounds?.main) {
        assetsToLoad.push({
          id: 'background_main',
          url: this.gameData.assets.backgrounds.main,
          options: { type: 'image' as AssetType }
        });
      }
    } else {
      // Legacy asset format
      const visualAssets = this.gameData.assets?.visual;
      if (!visualAssets) return;
      
      // Preload images
      if (visualAssets.images) {
        for (const [id, url] of Object.entries(visualAssets.images)) {
          assetsToLoad.push({
            id,
            url: url as string,
            options: { type: 'image' as AssetType }
          });
        }
      }
      
      // Preload spritesheets
      if (visualAssets.spritesheets) {
        for (const [id, url] of Object.entries(visualAssets.spritesheets)) {
          assetsToLoad.push({
            id,
            url: url as string,
            options: { type: 'spritesheet' as AssetType }
          });
        }
      }
      
      // Preload data files
      if (visualAssets.data) {
        for (const [id, url] of Object.entries(visualAssets.data)) {
          assetsToLoad.push({
            id,
            url: url as string,
            options: { type: 'json' as AssetType }
          });
        }
      }
    }
    
    try {
      // Preload all assets
      if (assetsToLoad.length > 0) {
        console.log('Loading assets:', assetsToLoad.map(a => a.id));
        await this.assetManager.preloadAssets(assetsToLoad);
      }
      
      // Create sprites if sprite configurations are provided
      if (this.gameData.sprites) {
        for (const [id, config] of Object.entries(this.gameData.sprites)) {
          const spriteConfig = config as any;
          this.assetManager.createSprite(
            id,
            spriteConfig.sheet || spriteConfig.image,
            {
              frameWidth: spriteConfig.frameWidth,
              frameHeight: spriteConfig.frameHeight,
              frames: spriteConfig.frames,
              frameTime: spriteConfig.frameTime || 0.1,
              loop: spriteConfig.loop !== undefined ? spriteConfig.loop : true
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to preload assets:', error);
    }
  }
  
  /**
   * Preload audio assets from game data
   */
  private async preloadAudioAssets(): Promise<void> {
    if (!this.soundManager) return;
    
    const audioAssets = this.gameData.assets?.audio;
    if (!audioAssets) return;
    
    // Initialize sound manager on first user interaction
    const onFirstInteraction = () => {
      this.soundManager?.initialize();
      document.removeEventListener('click', onFirstInteraction);
      document.removeEventListener('keydown', onFirstInteraction);
      document.removeEventListener('touchstart', onFirstInteraction);
    };
    
    document.addEventListener('click', onFirstInteraction, { once: true });
    document.addEventListener('keydown', onFirstInteraction, { once: true });
    document.addEventListener('touchstart', onFirstInteraction, { once: true });
    
    // Preload sound effects
    if (audioAssets.effects) {
      const effectsToLoad = Object.entries(audioAssets.effects).map(([id, url]) => ({
        id,
        url: url as string,
        options: { loop: false, volume: 1.0 }
      }));
      
      await this.soundManager.preloadSounds(effectsToLoad);
    }
    
    // Preload background music
    if (audioAssets.music) {
      const musicToLoad = Object.entries(audioAssets.music).map(([id, url]) => ({
        id,
        url: url as string,
        options: { loop: true, volume: 0.5 }
      }));
      
      await this.soundManager.preloadSounds(musicToLoad);
      
      // Auto-play background music if specified
      if (this.gameData.parameters?.audio?.backgroundMusic) {
        const musicId = this.gameData.parameters.audio.backgroundMusic;
        this.playBackgroundMusic(musicId);
      }
    }
  }
  
  /**
   * Initialize game entities from game data
   */
  private initializeEntities(): void {
    if (!this.activeScene) return;
    
    const params = this.gameData.parameters;
    this.currentLevelIndex = 0;
    this.score = 0;
    this.collectedItems = 0;
    this.totalCollectibles = 0;
    this.gameCompleted = false;
    
    // Load the current level
    this.loadLevel(this.currentLevelIndex);
  }
  
  /**
   * Load a specific level
   */
  private loadLevel(levelIndex: number): void {
    if (!this.activeScene) return;
    
    // Clear existing entities
    this.activeScene.clear();
    
    const params = this.gameData.parameters;
    
    // Check if level exists
    if (!params.world || !params.world.levels || 
        !params.world.levels[levelIndex]) {
      console.error(`Level ${levelIndex} does not exist`);
      return;
    }
    
    const level = params.world.levels[levelIndex];
    console.log(`Loading level ${levelIndex}: ${level.name}`);
    
    // Create player entity
    if (params.player) {
      const player = new Entity({
        x: params.player.startX || 100,
        y: params.player.startY || 100,
        width: params.player.size || 32,
        height: params.player.size || 32,
        velocityX: 0,
        velocityY: 0,
        acceleration: params.player.acceleration || 0.5,
        color: params.player.color || '#ffffff',
        solid: true,
        tags: ['player']
      });
      
      // Add player-specific data
      player.setData('maxSpeed', params.player.speed || 5);
      player.setData('jumpForce', params.player.jumpForce || 10);
      player.setData('sprite', 'player');
      player.setData('facingLeft', false);
      
      // Add to the active scene
      this.activeScene.addEntity(player);
    }
    
    // Create enemy entities
    if (params.enemies && params.enemies.length > 0) {
      params.enemies.forEach((enemy: any, index: number) => {
        const enemyEntity = new Entity({
          x: enemy.x || (200 + index * 100),
          y: enemy.y || 100,
          width: enemy.size || 32,
          height: enemy.size || 32,
          velocityX: enemy.direction * (enemy.speed || 2),
          velocityY: enemy.speedY || 0,
          color: enemy.color || '#ff0000',
          solid: true,
          tags: ['enemy']
        });
        
        // Add enemy-specific data
        enemyEntity.setData('sprite', `enemy_${index % 3}`); // Use modulo to cycle through available sprites
        enemyEntity.setData('behavior', enemy.behavior || 'patrol');
        enemyEntity.setData('startX', enemy.x);
        enemyEntity.setData('direction', enemy.direction || 1);
        enemyEntity.setData('range', enemy.range || 100);
        enemyEntity.setData('speed', enemy.speed || 2);
        
        this.activeScene!.addEntity(enemyEntity);
      });
    }
    
    // Create collectible entities
    if (params.collectibles && params.collectibles.length > 0) {
      this.totalCollectibles = params.collectibles.length;
      
      params.collectibles.forEach((collectible: any, index: number) => {
        const collectibleEntity = new Entity({
          x: collectible.x || (150 + index * 70),
          y: collectible.y || 150,
          width: collectible.size || 24,
          height: collectible.size || 24,
          color: collectible.color || '#ffff00',
          solid: true,
          tags: ['collectible', 'platform']
        });
        
        // Add collectible-specific data
        collectibleEntity.setData('sprite', `collectible_${index % 3}`); // Use modulo to cycle through available sprites
        collectibleEntity.setData('value', collectible.value || 10);
        collectibleEntity.setData('sound', collectible.sound || 'collect');
        
        this.activeScene!.addEntity(collectibleEntity);
      });
    }
    
    // Create platform/world entities from current level
    if (level.platforms) {
      level.platforms.forEach((platform: any, index: number) => {
        const platformEntity = new Entity({
          x: platform.x || (100 + index * 150),
          y: platform.y || 400,
          width: platform.width || 100,
          height: platform.height || 20,
          color: platform.color || '#555555',
          solid: true,
          tags: ['platform']
        });
        
        // Add platform-specific data
        platformEntity.setData('sprite', platform.sprite || null);
        platformEntity.setData('type', platform.type || 'solid');
        
        // Add moving platform data
        if (platform.movingPlatform) {
          platformEntity.setData('movingPlatform', true);
          platformEntity.setData('moveSpeed', platform.moveSpeed || 1);
          platformEntity.setData('moveDistance', platform.moveDistance || 100);
          platformEntity.setData('moveDirection', platform.moveDirection || 'horizontal');
          platformEntity.setData('startX', platform.x);
          platformEntity.setData('startY', platform.y);
          platformEntity.setData('movePhase', 0);
        }
        
        // Add temporary platform data
        if (platform.type === 'temporary') {
          platformEntity.setData('temporary', true);
          platformEntity.setData('disappearTime', 0);
          platformEntity.setData('disappearDuration', platform.disappearDuration || 1);
        }
        
        this.activeScene!.addEntity(platformEntity);
      });
    }
    
    // Set background if specified
    if (level.background && this.renderer) {
      this.renderer.setBackgroundColor(level.background);
    }
  }
  
  /**
   * Create a new scene
   */
  createScene(id: string, options: SceneOptions): Scene {
    const scene = new Scene(options);
    this.scenes.set(id, scene);
    return scene;
  }
  
  /**
   * Set the active scene
   */
  setActiveScene(id: string): boolean {
    const scene = this.scenes.get(id);
    if (!scene) return false;
    
    this.activeScene = scene;
    return true;
  }
  
  /**
   * Get the active scene
   */
  getActiveScene(): Scene | null {
    return this.activeScene;
  }
  
  /**
   * Get a scene by ID
   */
  getScene(id: string): Scene | undefined {
    return this.scenes.get(id);
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;
    
    console.log('Starting game engine');
    this.running = true;
    this.lastFrameTime = performance.now();
    
    // Start input manager
    this.inputManager?.start();
    
    // Call onStart callback
    if (this.onStart) {
      this.onStart();
    }
    
    this.gameLoop();
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    console.log('Stopping game engine');
    this.running = false;
    
    // Stop input manager
    this.inputManager?.stop();
    
    // Call onStop callback
    if (this.onStop) {
      this.onStop();
    }
  }
  
  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.running) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    // Update game state
    this.update(deltaTime);
    
    // Render frame
    this.render();
    
    // Schedule next frame
    requestAnimationFrame(() => this.gameLoop());
  }
  
  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // Skip updates during level transition
    if (this.levelTransitioning) return;

    // Process input
    this.inputManager?.update();
    
    // Update sprite animations
    this.assetManager?.updateSprites(deltaTime);
    
    // Update active scene
    if (this.activeScene) {
      // Handle moving platforms
      const platforms = this.activeScene.getEntitiesByTag('platform');
      platforms.forEach(platform => {
        if (platform.getData('movingPlatform')) {
          this.updateMovingPlatform(platform, deltaTime);
        }
        
        // Handle temporary platforms
        if (platform.getData('temporary') && platform.getData('disappearTime') > 0) {
          const currentTime = platform.getData('disappearTime');
          const newTime = currentTime - deltaTime;
          if (newTime <= 0) {
            platform.active = false;
            platform.visible = false;
          } else {
            platform.setData('disappearTime', newTime);
          }
        }
      });

      this.activeScene.update(deltaTime);
      
      // Process input for entities
      if (this.inputManager) {
        const inputs = this.inputManager.getInputs();
        
        // Get player entity
        const playerEntities = this.activeScene.getEntitiesByTag('player');
        if (playerEntities.length > 0) {
          const player = playerEntities[0];
          
          // Track player direction for sprite flipping
          let facingLeft = player.getData('facingLeft') || false;
          
          // Handle input for player
          if (inputs.has('ArrowLeft') || inputs.has('KeyA')) {
            player.velocityX = -player.getData('maxSpeed');
            facingLeft = true;
          } else if (inputs.has('ArrowRight') || inputs.has('KeyD')) {
            player.velocityX = player.getData('maxSpeed');
            facingLeft = false;
          } else {
            player.velocityX = 0;
          }
          
          // Update facing direction
          player.setData('facingLeft', facingLeft);
          
          // Jump if on ground
          if ((inputs.has('ArrowUp') || inputs.has('KeyW') || inputs.has('Space')) && player.onGround) {
            player.velocityY = -player.getData('jumpForce');
            player.onGround = false;
            
            // Play jump sound if available
            this.playSound('jump');
            
            // Mark temporary platforms to disappear when jumped from
            platforms.forEach(platform => {
              if (platform.getData('temporary') && 
                  this.checkCollision(player, platform) && 
                  platform.getData('disappearTime') === 0) {
                platform.setData('disappearTime', platform.getData('disappearDuration') || 1);
              }
            });
          }
          
          // Check for collectible collisions
          const collectibles = this.activeScene.getEntitiesByTag('collectible');
          collectibles.forEach(collectible => {
            if (collectible.active && this.checkCollision(player, collectible)) {
              collectible.active = false;
              collectible.visible = false;
              
              // Update score
              this.score += collectible.getData('value') || 10;
              this.collectedItems++;
              
              // Play collection sound
              const soundId = collectible.getData('sound');
              if (soundId) {
                this.playSound(soundId);
              }
              
              // Check for level completion
              this.checkLevelCompletion();
            }
          });
          
          // Check for enemy collisions
          const enemies = this.activeScene.getEntitiesByTag('enemy');
          enemies.forEach(enemy => {
            if (enemy.active && this.checkCollision(player, enemy)) {
              // If player is falling onto enemy, destroy enemy
              if (player.velocityY > 0 && player.y + player.height < enemy.y + enemy.height / 2) {
                enemy.active = false;
                enemy.visible = false;
                player.velocityY = -7; // Small bounce
                this.score += 50; // Bonus for defeating enemy
                this.playSound('hit');
              } else {
                // Player loses health/dies
                // In a real game, you'd implement player health here
                // For now, just reset player position
                player.x = this.gameData.parameters.player.startX || 100;
                player.y = this.gameData.parameters.player.startY || 100;
                player.velocityX = 0;
                player.velocityY = 0;
                this.playSound('hit');
              }
            }
          });
          
          // Check if player fell off the level
          if (player.y > this.gameData.parameters.world.height) {
            player.x = this.gameData.parameters.player.startX || 100;
            player.y = this.gameData.parameters.player.startY || 100;
            player.velocityX = 0;
            player.velocityY = 0;
            this.playSound('hit');
          }
          
          // Check if reached the level exit (right edge for simplicity)
          if (player.x > this.gameData.parameters.world.width - player.width * 2) {
            this.goToNextLevel();
          }
        }
      }
      
      // Update enemies with AI behavior
      const enemies = this.activeScene.getEntitiesByTag('enemy');
      enemies.forEach(enemy => {
        if (enemy.active) {
          const behavior = enemy.getData('behavior');
          if (behavior === 'patrol') {
            this.updatePatrolEnemy(enemy, deltaTime);
          }
        }
      });
    }
    
    // Call custom update handler if provided
    if (this.onUpdate) {
      this.onUpdate(deltaTime);
    }
  }
  
  /**
   * Update moving platform
   */
  private updateMovingPlatform(platform: Entity, deltaTime: number): void {
    const speed = platform.getData('moveSpeed') || 1;
    const distance = platform.getData('moveDistance') || 100;
    const direction = platform.getData('moveDirection') || 'horizontal';
    const startX = platform.getData('startX') || platform.x;
    const startY = platform.getData('startY') || platform.y;
    let phase = platform.getData('movePhase') || 0;
    
    // Update phase
    phase = (phase + speed * deltaTime) % (Math.PI * 2);
    platform.setData('movePhase', phase);
    
    // Apply movement
    if (direction === 'horizontal') {
      platform.x = startX + Math.sin(phase) * distance;
    } else if (direction === 'vertical') {
      platform.y = startY + Math.sin(phase) * distance;
    }
  }
  
  /**
   * Update patrol enemy
   */
  private updatePatrolEnemy(enemy: Entity, deltaTime: number): void {
    const startX = enemy.getData('startX') || enemy.x;
    const range = enemy.getData('range') || 100;
    const speed = enemy.getData('speed') || 2;
    const direction = enemy.getData('direction') || 1;
    
    // Check if at edge of patrol range
    if (direction > 0 && enemy.x > startX + range) {
      enemy.setData('direction', -1);
      enemy.velocityX = -speed;
    } else if (direction < 0 && enemy.x < startX - range) {
      enemy.setData('direction', 1);
      enemy.velocityX = speed;
    }
  }
  
  /**
   * Check if level is completed
   */
  private checkLevelCompletion(): void {
    // Check if all collectibles are collected
    const collectibles = this.activeScene?.getEntitiesByTag('collectible') || [];
    const activeCollectibles = collectibles.filter(c => c.active);
    
    // Get required collectibles from level
    const level = this.gameData.parameters.world.levels[this.currentLevelIndex];
    const requiredCollectibles = level.requiredCollectibles || collectibles.length;
    
    if (this.collectedItems >= requiredCollectibles) {
      console.log('Level complete!');
      // Play a sound
      this.playSound('collect');
    }
  }
  
  /**
   * Go to the next level
   */
  private goToNextLevel(): void {
    if (this.levelTransitioning) return;
    
    this.levelTransitioning = true;
    const nextLevelIndex = this.currentLevelIndex + 1;
    
    // Check if there are more levels
    if (nextLevelIndex < this.gameData.parameters.world.levels.length) {
      // Show level transition UI
      if (this.renderer) {
        const ctx = this.renderer.getContext();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${this.currentLevelIndex + 1} Complete!`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
        ctx.fillText(`Score: ${this.score}`, ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.fillText(`Loading Level ${nextLevelIndex + 1}...`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
      }
      
      // Wait a bit before loading next level
      setTimeout(() => {
        this.currentLevelIndex = nextLevelIndex;
        this.loadLevel(this.currentLevelIndex);
        this.levelTransitioning = false;
      }, 2000);
    } else {
      // Game completed
      this.gameCompleted = true;
      
      // Show game completion UI
      if (this.renderer) {
        const ctx = this.renderer.getContext();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Completed!', ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${this.score}`, ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.fillText('Press any key to restart', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
      }
      
      // Listen for key press to restart
      const restartHandler = () => {
        document.removeEventListener('keydown', restartHandler);
        document.removeEventListener('click', restartHandler);
        this.currentLevelIndex = 0;
        this.score = 0;
        this.collectedItems = 0;
        this.gameCompleted = false;
        this.loadLevel(this.currentLevelIndex);
        this.levelTransitioning = false;
      };
      
      document.addEventListener('keydown', restartHandler);
      document.addEventListener('click', restartHandler);
    }
  }
  
  /**
   * Render game frame
   */
  private render(): void {
    if (!this.renderer || !this.assetManager) return;
    
    // Render active scene
    if (this.activeScene) {
      this.activeScene.render(this.renderer);
      
      // Render sprites for entities
      const ctx = this.renderer.getContext();
      this.activeScene.entities.forEach(entity => {
        if (entity.visible) {
          const spriteId = entity.getData('sprite');
          if (spriteId) {
            const facingLeft = entity.getData('facingLeft') || false;
            this.assetManager!.drawSprite(
              ctx,
              spriteId,
              entity.x,
              entity.y,
              entity.width,
              entity.height,
              facingLeft
            );
          }
        }
      });
      
      // Render UI
      this.renderUI(ctx);
    }
    
    // Call custom render handler if provided
    if (this.onRender && this.renderer) {
      this.onRender(this.renderer.getContext());
    }
  }
  
  /**
   * Render UI elements
   */
  private renderUI(ctx: CanvasRenderingContext2D): void {
    // Skip UI during transitions
    if (this.levelTransitioning || this.gameCompleted) return;
    
    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 10, 20);
    
    // Draw level info
    const level = this.gameData.parameters.world.levels[this.currentLevelIndex];
    ctx.textAlign = 'center';
    ctx.fillText(`${level.name}`, ctx.canvas.width / 2, 20);
    
    // Draw collectibles count
    const collectibles = this.activeScene?.getEntitiesByTag('collectible') || [];
    const activeCollectibles = collectibles.filter(c => c.active).length;
    const requiredCollectibles = level.requiredCollectibles || collectibles.length;
    
    ctx.textAlign = 'right';
    ctx.fillText(`Collectibles: ${this.collectedItems}/${requiredCollectibles}`, ctx.canvas.width - 10, 20);
  }
  
  /**
   * Check collision between two entities (simple AABB)
   */
  private checkCollision(a: Entity, b: Entity): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }
  
  /**
   * Play a sound effect
   */
  playSound(id: string): string | null {
    if (!this.soundManager) return null;
    return this.soundManager.playSound(id);
  }
  
  /**
   * Play background music
   */
  playBackgroundMusic(id: string): boolean {
    if (!this.soundManager) return false;
    return this.soundManager.playBackgroundMusic(id);
  }
  
  /**
   * Stop background music
   */
  stopBackgroundMusic(): boolean {
    if (!this.soundManager) return false;
    return this.soundManager.stopBackgroundMusic();
  }
  
  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.soundManager?.setMasterVolume(volume);
  }
  
  /**
   * Mute all audio
   */
  muteAudio(): void {
    this.soundManager?.mute();
  }
  
  /**
   * Unmute all audio
   */
  unmuteAudio(): void {
    this.soundManager?.unmute();
  }
  
  /**
   * Toggle audio mute state
   */
  toggleMuteAudio(): boolean {
    if (!this.soundManager) return false;
    return this.soundManager.toggleMute();
  }
  
  /**
   * Load an asset
   */
  loadAsset(id: string, url: string, options?: AssetOptions): Promise<any> {
    if (!this.assetManager) {
      return Promise.reject(new Error('Asset manager not initialized'));
    }
    return this.assetManager.loadAsset(id, url, options);
  }
  
  /**
   * Get an image asset
   */
  getImage(id: string): HTMLImageElement | null {
    return this.assetManager?.getImage(id) || null;
  }
  
  /**
   * Add an entity to the active scene
   */
  addEntity(entity: Entity): Entity | null {
    if (!this.activeScene) return null;
    return this.activeScene.addEntity(entity);
  }
  
  /**
   * Remove an entity from the active scene
   */
  removeEntity(entityId: string): void {
    if (!this.activeScene) return;
    this.activeScene.removeEntity(entityId);
  }
  
  /**
   * Get the renderer
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }
  
  /**
   * Get the input manager
   */
  getInputManager(): InputManager | null {
    return this.inputManager;
  }
  
  /**
   * Get the sound manager
   */
  getSoundManager(): SoundManager | null {
    return this.soundManager;
  }
  
  /**
   * Get the asset manager
   */
  getAssetManager(): AssetManager | null {
    return this.assetManager;
  }
  
  /**
   * Resize the game
   */
  resize(width: number, height: number): void {
    this.renderer?.resize(width, height);
  }
  
  /**
   * Cleanup resources when disposing engine
   */
  dispose(): void {
    this.stop();
    this.scenes.forEach(scene => scene.clear());
    this.scenes.clear();
    this.activeScene = null;
    this.inputManager?.dispose();
    this.inputManager = null;
    this.soundManager?.dispose();
    this.soundManager = null;
    this.assetManager?.dispose();
    this.assetManager = null;
  }
} 