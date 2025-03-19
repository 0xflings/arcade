import { GameTemplate, Game, GameTemplateManager } from './template';

// Simple platformer game implementation
class PlatformerGame implements Game {
  private id: string = '';
  private template: GameTemplate;
  private parameters: any;
  private assets: any = {};
  private metadata: any = {
    created: new Date().toISOString(),
    editCount: 0,
  };
  
  constructor(template: GameTemplate, parameters: any) {
    this.template = template;
    this.parameters = parameters;
    
    // Apply procedural enhancements to make the game more interesting
    this.enhanceGameParameters();
  }
  
  /**
   * Enhance game parameters to make gameplay more interesting
   */
  private enhanceGameParameters(): void {
    // If levels are empty or have minimal platforms, generate better ones
    if (!this.parameters.world.levels || 
        this.parameters.world.levels.length === 0 || 
        !this.parameters.world.levels[0].platforms || 
        this.parameters.world.levels[0].platforms.length < 5) {
      
      // Create 3 varied levels
      this.parameters.world.levels = [
        this.generateLevel(1, 'Easy'),
        this.generateLevel(2, 'Medium'),
        this.generateLevel(3, 'Hard')
      ];
    }
    
    // Enhance collectibles if they're empty
    if (!this.parameters.collectibles || this.parameters.collectibles.length < 5) {
      this.parameters.collectibles = this.generateCollectibles(15);
    }
    
    // Enhance enemies if they're empty
    if (!this.parameters.enemies || this.parameters.enemies.length < 3) {
      this.parameters.enemies = this.generateEnemies(5);
    }
  }
  
  /**
   * Generate a randomized level
   */
  private generateLevel(levelNumber: number, difficulty: string): any {
    const worldWidth = this.parameters.world.width || 800;
    const worldHeight = this.parameters.world.height || 600;
    const floorY = worldHeight - 50;
    
    // Create floor platform
    const platforms = [
      { x: 0, y: floorY, width: worldWidth, height: 50, type: 'solid' }
    ];
    
    // Generate random platforms
    const numPlatforms = 10 + levelNumber * 5; // More platforms in higher levels
    const minY = 100;
    const maxY = floorY - 70;
    
    // Generate a more structured level layout
    for (let i = 0; i < numPlatforms; i++) {
      // Create stepped platforms
      const platformWidth = Math.floor(Math.random() * 100) + 50;
      const platformHeight = 20;
      
      // Calculate position based on level height division
      const sectionHeight = (maxY - minY) / numPlatforms;
      const y = minY + i * sectionHeight + Math.floor(Math.random() * 30);
      
      // Horizontal position with slight randomness but ensuring playability
      let x: number;
      if (i % 2 === 0) {
        // Left side
        x = Math.floor(Math.random() * (worldWidth / 3)) + 50;
      } else {
        // Right side
        x = Math.floor(Math.random() * (worldWidth / 3)) + (worldWidth / 2);
      }
      
      // Add some movement based on level number
      const movement = levelNumber > 1 ? {
        movingPlatform: true,
        moveSpeed: 1 + levelNumber * 0.5,
        moveDistance: 100,
        moveDirection: i % 2 === 0 ? 'horizontal' : 'vertical'
      } : {};
      
      // Add platform type based on level
      const platformType = levelNumber > 2 && i % 3 === 0 ? 
        'temporary' : // Temporary platforms in hard levels
        'solid';
      
      platforms.push({
        x,
        y,
        width: platformWidth,
        height: platformHeight,
        type: platformType,
        ...movement
      });
    }
    
    return {
      name: `Level ${levelNumber}: ${difficulty}`,
      platforms,
      background: `level${levelNumber}_bg`,
      requiredCollectibles: levelNumber * 5
    };
  }
  
  /**
   * Generate collectibles scattered throughout the level
   */
  private generateCollectibles(count: number): any[] {
    const worldWidth = this.parameters.world.width || 800;
    const worldHeight = this.parameters.world.height || 600;
    const collectibles = [];
    
    // Place collectibles on platforms
    if (this.parameters.world.levels) {
      for (const level of this.parameters.world.levels) {
        if (level.platforms) {
          for (const platform of level.platforms) {
            // Skip the floor platform
            if (platform.width > 200) continue;
            
            // Place 1-2 collectibles on each platform
            const collectibleCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < collectibleCount; i++) {
              const x = platform.x + Math.floor(Math.random() * (platform.width - 30)) + 15;
              const y = platform.y - 30; // Above the platform
              
              collectibles.push({
                type: 'coin',
                x,
                y,
                value: 10,
                size: 24
              });
              
              // Stop if we've reached the desired count
              if (collectibles.length >= count) break;
            }
            
            if (collectibles.length >= count) break;
          }
        }
      }
    }
    
    // If we still need more collectibles, add them randomly
    while (collectibles.length < count) {
      collectibles.push({
        type: 'coin',
        x: Math.floor(Math.random() * (worldWidth - 50)) + 25,
        y: Math.floor(Math.random() * (worldHeight - 150)) + 50,
        value: 10,
        size: 24
      });
    }
    
    return collectibles;
  }
  
  /**
   * Generate enemies for the levels
   */
  private generateEnemies(count: number): any[] {
    const worldWidth = this.parameters.world.width || 800;
    const enemies = [];
    
    // Place enemies on platforms
    if (this.parameters.world.levels) {
      for (const level of this.parameters.world.levels) {
        if (level.platforms) {
          for (const platform of level.platforms) {
            // Only place enemies on larger platforms
            if (platform.width < 100) continue;
            
            // Skip the floor for a few enemies - more challenge!
            if (platform.width > 200 && enemies.length < count-2) continue;
            
            // Add an enemy on this platform
            const x = platform.x + Math.floor(platform.width / 2);
            const y = platform.y - 32; // Above the platform
            
            enemies.push({
              type: 'basic',
              x,
              y,
              speed: 2,
              direction: Math.random() > 0.5 ? 1 : -1,
              range: platform.width - 50
            });
            
            // Stop if we've reached the desired count
            if (enemies.length >= count) break;
          }
        }
        
        if (enemies.length >= count) break;
      }
    }
    
    // If we still need more enemies, add them on the floor
    while (enemies.length < count) {
      enemies.push({
        type: 'basic',
        x: Math.floor(Math.random() * (worldWidth - 100)) + 50,
        y: 520,
        speed: 2,
        direction: Math.random() > 0.5 ? 1 : -1,
        range: 200
      });
    }
    
    return enemies;
  }
  
  getId(): string {
    return this.id;
  }
  
  getTemplate(): GameTemplate {
    return this.template;
  }
  
  getParameters(): any {
    return this.parameters;
  }
  
  getAssets(): any {
    return this.assets;
  }
  
  getMetadata(): any {
    return this.metadata;
  }
  
  setId(id: string): void {
    this.id = id;
  }
  
  setMetadata(metadata: any): void {
    this.metadata = { ...this.metadata, ...metadata };
  }
  
  loadAssets(assets: any): void {
    this.assets = { ...this.assets, ...assets };
  }
  
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic validation - check required parameters
    if (!this.parameters.world) {
      errors.push('Missing world parameters');
    }
    
    if (!this.parameters.player) {
      errors.push('Missing player parameters');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  serialize(): any {
    return {
      id: this.id,
      template: this.template.id,
      parameters: this.parameters,
      assets: this.assets,
      metadata: this.metadata,
    };
  }
}

// Define the platformer template
const platformerTemplate: GameTemplate = new GameTemplate({
  id: 'platformer',
  name: 'Platformer',
  genre: 'platformer',
  parameterSchema: {
    type: 'object',
    properties: {
      world: {
        type: 'object',
        properties: {
          title: { type: 'string', default: 'New Platformer Game' },
          gravity: { type: 'number', default: 0.5 },
          width: { type: 'number', default: 800 },
          height: { type: 'number', default: 600 },
          levels: { 
            type: 'array',
            default: [
              { 
                name: 'Level 1', 
                platforms: [
                  // Default floor
                  { x: 0, y: 550, width: 800, height: 50, type: 'solid' },
                  // Some platforms
                  { x: 200, y: 450, width: 150, height: 20, type: 'solid' },
                  { x: 450, y: 350, width: 150, height: 20, type: 'solid' },
                  { x: 100, y: 250, width: 150, height: 20, type: 'solid' },
                  { x: 400, y: 150, width: 150, height: 20, type: 'solid' }
                ] 
              }
            ]
          }
        }
      },
      player: {
        type: 'object',
        properties: {
          speed: { type: 'number', default: 5 },
          jumpForce: { type: 'number', default: 10 },
          color: { type: 'string', default: '#FF00FF' },
          size: { type: 'number', default: 32 },
          startX: { type: 'number', default: 100 },
          startY: { type: 'number', default: 450 }
        }
      },
      enemies: {
        type: 'array',
        default: [
          { type: 'basic', x: 500, y: 320, speed: 2, direction: -1, range: 150 },
          { type: 'basic', x: 300, y: 520, speed: 2, direction: 1, range: 200 }
        ]
      },
      collectibles: {
        type: 'array',
        default: [
          { type: 'coin', x: 250, y: 420, value: 10 },
          { type: 'coin', x: 350, y: 420, value: 10 },
          { type: 'coin', x: 500, y: 320, value: 10 },
          { type: 'coin', x: 550, y: 320, value: 10 },
          { type: 'coin', x: 150, y: 220, value: 10 },
          { type: 'coin', x: 200, y: 220, value: 10 },
          { type: 'coin', x: 450, y: 120, value: 10 },
          { type: 'coin', x: 500, y: 120, value: 10 }
        ]
      }
    }
  },
  examples: [
    // Example platformer configurations would go here
  ],
  createGame: (parameters: any): Game => {
    return new PlatformerGame(platformerTemplate, parameters);
  }
});

// Register the template
GameTemplateManager.registerTemplate(platformerTemplate);

export default platformerTemplate; 