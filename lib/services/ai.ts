/**
 * AI service for game generation and editing using OpenAI
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Custom error class for OpenAI errors
export class AIServiceError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'unknown_error') {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
  }
}

export class AIService {
  /**
   * Analyzes a prompt to extract game requirements
   */
  static async analyzePrompt(prompt: string) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI specialized in analyzing game descriptions and extracting structured information.
                      Extract the following information from the game prompt:
                      - title: A catchy, relevant title for the game
                      - genre: The primary genre (platformer, shooter, puzzle, etc.)
                      - mechanics: List of core gameplay mechanics
                      - visualStyle: The visual aesthetic (pixel art, neon, etc.)
                      - characters: Main characters or entities
                      - objectives: Primary gameplay goals or objectives
                      Return ONLY a JSON object with these fields and no other text.`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      // Parse the JSON response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceError("Empty response from OpenAI", "empty_response");
      }

      return JSON.parse(content);
    } catch (error: any) {
      console.error("Error analyzing prompt with OpenAI:", error);
      
      // Handle specific API errors
      if (error.status === 429 || (error.error && error.error.code === 'insufficient_quota')) {
        throw new AIServiceError(
          "OpenAI API quota exceeded. Please try again later or check your billing details.",
          "insufficient_quota"
        );
      }
      
      // If this is already our custom error, rethrow it
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      // For other errors, throw with the original message but our custom type
      throw new AIServiceError(
        error.message || "Error analyzing prompt with OpenAI",
        error.code || "ai_service_error"
      );
      
      // Fallback implementation happens in the route handler, not here
    }
  }
  
  /**
   * Generates game parameters based on analysis and template
   */
  static async generateGameParameters(analysis: any, template: any) {
    try {
      // Get the parameter schema and default parameters from the template
      const parameterSchema = template.getParameterSchema();
      const defaultParameters = template.getDefaultParameters();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI specialized in generating game parameters.
                      Given the analysis of a game prompt and a parameter schema,
                      generate appropriate parameter values for the game.
                      Your response MUST conform to the schema provided.
                      Return ONLY a JSON object and no other text.`
          },
          {
            role: "user",
            content: `Game analysis: ${JSON.stringify(analysis)}
                      Parameter schema: ${JSON.stringify(parameterSchema)}
                      Default parameters: ${JSON.stringify(defaultParameters)}
                      
                      Generate parameters for this game that follow the schema and incorporate the analysis information.`
          }
        ]
      });

      // Parse the JSON response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceError("Empty response from OpenAI", "empty_response");
      }

      const generatedParameters = JSON.parse(content);
      
      // Validate the parameters against the schema
      // This is a simple validation that the top-level keys exist
      // A more robust validation would check types and required fields
      const isValid = Object.keys(parameterSchema).every(key => 
        generatedParameters[key] !== undefined
      );
      
      if (!isValid) {
        throw new AIServiceError("Generated parameters do not match schema", "invalid_parameters");
      }
      
      return generatedParameters;
    } catch (error: any) {
      console.error("Error generating parameters with OpenAI:", error);
      
      // Handle specific API errors
      if (error.status === 429 || (error.error && error.error.code === 'insufficient_quota')) {
        throw new AIServiceError(
          "OpenAI API quota exceeded. Please try again later or check your billing details.",
          "insufficient_quota"
        );
      }
      
      // If this is already our custom error, rethrow it
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      // For other errors, throw with the original message but our custom type
      throw new AIServiceError(
        error.message || "Error generating parameters with OpenAI",
        error.code || "ai_service_error"
      );
      
      // Fallback implementation happens in the route handler, not here
    }
  }
  
  /**
   * Analyzes an edit request for an existing game
   */
  static async analyzeEditRequest(game: any, editRequest: string) {
    try {
      const gameData = game.serialize();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI specialized in analyzing game edit requests.
                      Given a game's current data and an edit request,
                      determine what changes need to be made.
                      Extract the following information:
                      - targetElements: List of game elements to modify
                      - changeType: Type of change (add, remove, modify)
                      - parameterChanges: Specific parameter changes
                      - needsNewSprites: Whether new sprites are needed
                      - needsNewBackgrounds: Whether new backgrounds are needed
                      Return ONLY a JSON object with these fields and no other text.`
          },
          {
            role: "user",
            content: `Game data: ${JSON.stringify(gameData)}
                      Edit request: ${editRequest}`
          }
        ]
      });

      // Parse the JSON response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error analyzing edit request with OpenAI:", error);
      // Fallback to placeholder implementation if OpenAI fails
      return {
        targetElements: [],
        changeType: 'modify',
        parameterChanges: [],
        needsNewSprites: false,
        needsNewBackgrounds: false,
      };
    }
  }
  
  /**
   * Modifies game parameters based on edit analysis
   */
  static async modifyGameParameters(game: any, analysis: any) {
    try {
      const currentParameters = game.getParameters();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI specialized in modifying game parameters.
                      Given a game's current parameters and an analysis of requested changes,
                      generate updated parameters.
                      Your response MUST maintain the same structure as the original parameters.
                      Return ONLY a JSON object and no other text.`
          },
          {
            role: "user",
            content: `Current parameters: ${JSON.stringify(currentParameters)}
                      Change analysis: ${JSON.stringify(analysis)}`
          }
        ]
      });

      // Parse the JSON response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error modifying parameters with OpenAI:", error);
      // Return original parameters if OpenAI fails
      return game.getParameters();
    }
  }
}

// Helper functions for the fallback implementation
function generateGameTitle(prompt: string): string {
  const titles = [
    'Pixel Adventure', 
    'Neon Dash', 
    'Retro Runner', 
    'Arcade Hero',
    'Bit Blaster',
    'Cyber Jumper',
    'Digital Dreams',
    'Epic 8-bit'
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
}

function determineGenre(prompt: string): string {
  const genres = ['platformer', 'shooter', 'puzzle', 'racing', 'adventure'];
  
  // Very basic keyword matching - used only as fallback
  for (const genre of genres) {
    if (prompt.toLowerCase().includes(genre)) {
      return genre;
    }
  }
  
  return 'platformer'; // Default genre
} 