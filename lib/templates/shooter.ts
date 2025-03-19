import { GameTemplate, Game, GameTemplateManager } from './template';

// Simple shooter game implementation
class ShooterGame implements Game {
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
    
    if (!this.parameters.weapons) {
      errors.push('Missing weapons parameters');
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

// Define the shooter template
const shooterTemplate: GameTemplate = new GameTemplate({
  id: 'shooter',
  name: 'Shooter',
  genre: 'shooter',
  parameterSchema: {
    type: 'object',
    properties: {
      world: {
        type: 'object',
        properties: {
          title: { type: 'string', default: 'New Shooter Game' },
          viewType: { type: 'string', enum: ['topDown', 'sideScroll'], default: 'topDown' },
          width: { type: 'number', default: 800 },
          height: { type: 'number', default: 600 },
          levels: { 
            type: 'array',
            default: [
              { name: 'Level 1', obstacles: [], spawnPoints: [] }
            ]
          }
        }
      },
      player: {
        type: 'object',
        properties: {
          speed: { type: 'number', default: 4 },
          health: { type: 'number', default: 100 },
          color: { type: 'string', default: '#00AAFF' },
          size: { type: 'number', default: 32 },
          rotationSpeed: { type: 'number', default: 5 }
        }
      },
      weapons: {
        type: 'array',
        default: [
          {
            name: 'Default Gun',
            damage: 10,
            fireRate: 5,
            bulletSpeed: 10,
            bulletSize: 5,
            bulletColor: '#FFFF00',
            ammo: -1, // -1 for infinite
            spread: 0
          }
        ]
      },
      enemies: {
        type: 'array',
        default: []
      },
      powerups: {
        type: 'array',
        default: []
      }
    }
  },
  examples: [
    // Example shooter configurations would go here
    {
      world: {
        title: 'Space Defender',
        viewType: 'topDown',
        width: 800,
        height: 600,
        levels: [
          { 
            name: 'Space Station', 
            obstacles: [
              { x: 100, y: 100, width: 50, height: 200, type: 'wall' },
              { x: 300, y: 300, width: 100, height: 100, type: 'destructible' }
            ],
            spawnPoints: [
              { x: 50, y: 50, enemyType: 'basic', interval: 5000 }
            ]
          }
        ]
      },
      player: {
        speed: 5,
        health: 100,
        color: '#00FFAA',
        size: 30,
        rotationSpeed: 6
      },
      weapons: [
        {
          name: 'Laser Blaster',
          damage: 15,
          fireRate: 8,
          bulletSpeed: 12,
          bulletSize: 4,
          bulletColor: '#FF0000',
          ammo: -1,
          spread: 0
        },
        {
          name: 'Scatter Gun',
          damage: 5,
          fireRate: 3,
          bulletSpeed: 8,
          bulletSize: 3,
          bulletColor: '#FFAA00',
          ammo: 30,
          spread: 0.2
        }
      ]
    }
  ],
  createGame: (parameters: any): Game => {
    return new ShooterGame(shooterTemplate, parameters);
  }
});

// Register the template
GameTemplateManager.registerTemplate(shooterTemplate);

export default shooterTemplate; 