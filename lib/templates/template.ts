/**
 * Game template system
 */

export interface GameTemplateConfig {
  id: string;
  name: string;
  genre: string;
  parameterSchema: any;
  examples: any[];
  createGame: (parameters: any) => Game;
}

export class GameTemplate {
  id: string;
  name: string;
  genre: string;
  private parameterSchema: any;
  private examples: any[];
  private createGameFn: (parameters: any) => Game;
  
  constructor(config: GameTemplateConfig) {
    this.id = config.id;
    this.name = config.name;
    this.genre = config.genre;
    this.parameterSchema = config.parameterSchema;
    this.examples = config.examples;
    this.createGameFn = config.createGame;
  }
  
  getParameterSchema() {
    return this.parameterSchema;
  }
  
  getExamples() {
    return this.examples;
  }
  
  getDefaultParameters() {
    // Create a basic set of parameters based on the schema
    const result: any = {};
    
    const createDefault = (schema: any) => {
      if (!schema || !schema.properties) return {};
      
      const defaults: any = {};
      
      for (const [key, prop] of Object.entries<any>(schema.properties)) {
        if (prop.type === 'string') {
          defaults[key] = prop.default || '';
        } else if (prop.type === 'number') {
          defaults[key] = prop.default || 0;
        } else if (prop.type === 'boolean') {
          defaults[key] = prop.default || false;
        } else if (prop.type === 'array') {
          defaults[key] = prop.default || [];
        } else if (prop.type === 'object') {
          defaults[key] = createDefault(prop);
        }
      }
      
      return defaults;
    };
    
    return createDefault(this.parameterSchema);
  }
  
  createGame(parameters: any): Game {
    return this.createGameFn(parameters);
  }
}

export interface Game {
  getId(): string;
  getTemplate(): GameTemplate;
  getParameters(): any;
  getAssets(): any;
  getMetadata(): any;
  setId(id: string): void;
  setMetadata(metadata: any): void;
  loadAssets(assets: any): void;
  validate(): { valid: boolean; errors: string[] };
  serialize(): any;
}

export class GameTemplateManager {
  private static templates: GameTemplate[] = [];
  
  static registerTemplate(template: GameTemplate) {
    this.templates.push(template);
  }
  
  static getTemplates() {
    return this.templates;
  }
  
  static getTemplateById(id: string) {
    return this.templates.find(t => t.id === id);
  }
  
  static selectTemplate(analysis: any) {
    // Simple template selection based on genre
    const genreMatch = this.templates.find(t => t.genre === analysis.genre);
    
    if (genreMatch) {
      return genreMatch;
    }
    
    // Fallback to first template
    return this.templates[0] || null;
  }
} 