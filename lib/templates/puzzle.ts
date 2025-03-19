import { GameTemplate, Game, GameTemplateManager } from './template';

// Simple puzzle game implementation
class PuzzleGame implements Game {
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
    
    if (!this.parameters.puzzleType) {
      errors.push('Missing puzzle type');
    }
    
    if (!this.parameters.levels || this.parameters.levels.length === 0) {
      errors.push('Missing puzzle levels');
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

// Define the puzzle template
const puzzleTemplate: GameTemplate = new GameTemplate({
  id: 'puzzle',
  name: 'Puzzle',
  genre: 'puzzle',
  parameterSchema: {
    type: 'object',
    properties: {
      world: {
        type: 'object',
        properties: {
          title: { type: 'string', default: 'New Puzzle Game' },
          width: { type: 'number', default: 800 },
          height: { type: 'number', default: 600 },
          backgroundColor: { type: 'string', default: '#222233' },
          themeColor: { type: 'string', default: '#00AAFF' }
        }
      },
      puzzleType: {
        type: 'string',
        enum: ['match3', 'block', 'sliding', 'memory', 'word', 'logic'],
        default: 'match3'
      },
      gameRules: {
        type: 'object',
        properties: {
          timeLimit: { type: 'number', default: 60 }, // seconds, 0 for no limit
          scoreGoal: { type: 'number', default: 1000 },
          maxMoves: { type: 'number', default: 0 }, // 0 for unlimited moves
          livesCount: { type: 'number', default: 3 }
        }
      },
      levels: {
        type: 'array',
        default: [
          { 
            name: 'Level 1',
            difficulty: 1,
            gridSize: { width: 6, height: 6 },
            timeLimit: 60,
            goalScore: 500,
            items: []
          }
        ]
      },
      elements: {
        type: 'array',
        default: []
      },
      powerups: {
        type: 'array',
        default: []
      },
      audio: {
        type: 'object',
        properties: {
          backgroundMusic: { type: 'string', default: 'puzzle' },
          matchSound: { type: 'string', default: 'match' },
          successSound: { type: 'string', default: 'success' },
          failSound: { type: 'string', default: 'fail' }
        }
      }
    }
  },
  examples: [
    // Example puzzle configurations
    {
      world: {
        title: 'Gem Matcher',
        width: 800,
        height: 600,
        backgroundColor: '#1A1A2E',
        themeColor: '#E94560'
      },
      puzzleType: 'match3',
      gameRules: {
        timeLimit: 90,
        scoreGoal: 2000,
        maxMoves: 0,
        livesCount: 3
      },
      levels: [
        {
          name: 'Beginner Match',
          difficulty: 1,
          gridSize: { width: 6, height: 6 },
          timeLimit: 90,
          goalScore: 1000,
          items: [
            { type: 'gem', color: '#FF0000', points: 10, probability: 20 },
            { type: 'gem', color: '#00FF00', points: 10, probability: 20 },
            { type: 'gem', color: '#0000FF', points: 10, probability: 20 },
            { type: 'gem', color: '#FFFF00', points: 15, probability: 15 },
            { type: 'gem', color: '#FF00FF', points: 15, probability: 15 },
            { type: 'gem', color: '#00FFFF', points: 20, probability: 10 }
          ]
        },
        {
          name: 'Advanced Match',
          difficulty: 2,
          gridSize: { width: 7, height: 7 },
          timeLimit: 75,
          goalScore: 1500,
          items: [
            { type: 'gem', color: '#FF0000', points: 10, probability: 15 },
            { type: 'gem', color: '#00FF00', points: 10, probability: 15 },
            { type: 'gem', color: '#0000FF', points: 10, probability: 15 },
            { type: 'gem', color: '#FFFF00', points: 15, probability: 15 },
            { type: 'gem', color: '#FF00FF', points: 15, probability: 15 },
            { type: 'gem', color: '#00FFFF', points: 20, probability: 15 },
            { type: 'gem', color: '#FFFFFF', points: 30, probability: 10 }
          ]
        }
      ],
      elements: [
        { id: 'red', type: 'gem', color: '#FF0000', points: 10 },
        { id: 'green', type: 'gem', color: '#00FF00', points: 10 },
        { id: 'blue', type: 'gem', color: '#0000FF', points: 10 },
        { id: 'yellow', type: 'gem', color: '#FFFF00', points: 15 },
        { id: 'purple', type: 'gem', color: '#FF00FF', points: 15 },
        { id: 'cyan', type: 'gem', color: '#00FFFF', points: 20 },
        { id: 'white', type: 'gem', color: '#FFFFFF', points: 30 }
      ],
      powerups: [
        { id: 'bomb', name: 'Bomb', effect: 'explode3x3', probability: 5, activationType: 'match4' },
        { id: 'lightning', name: 'Lightning', effect: 'clearRow', probability: 3, activationType: 'match5' }
      ]
    }
  ],
  createGame: (parameters: any): Game => {
    return new PuzzleGame(puzzleTemplate, parameters);
  }
});

// Register the template
GameTemplateManager.registerTemplate(puzzleTemplate);

export default puzzleTemplate; 