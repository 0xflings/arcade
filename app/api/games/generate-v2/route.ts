import { NextResponse } from 'next/server';

// Define the OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// The system prompt instructing the model to generate a playable HTML game
const SYSTEM_PROMPT = `You are an expert at creating advanced, polished browser games using HTML, CSS, and JavaScript.
User will give you a prompt describing a game, and you must generate a standalone HTML file that implements that game.

EXTREMELY IMPORTANT: Your ENTIRE response must be ONLY valid HTML that begins with <!DOCTYPE html> and nothing else. DO NOT include ANY explanations, comments, or markdown formatting outside the HTML code.

Requirements:
1. Create a visually impressive, well-polished game with PROFESSIONAL-QUALITY GRAPHICS
2. You can use popular libraries, but MUST INCLUDE ALL REQUIRED MODULES/LOADERS:
   - For Three.js: Include both the core library AND any loaders you use (GLTFLoader, OBJLoader, etc.)
   - For Pixi.js, Phaser, p5.js: Include all required plugins
3. DO NOT use external resources like images, models, or sounds from external URLs
4. DO NOT use base64 encoded images - they consume too many tokens
5. Instead, create ALL visual elements using:
   - SVG graphics defined directly in code
   - Canvas-based procedural generation
   - CSS-based shapes and effects
   - WebGL procedural rendering
   - Three.js primitives and built-in materials
6. The game must be fully contained in a single HTML file with all necessary scripts and styles
7. The game must work in modern browsers
8. The game must be responsive and fit within the container div
9. The game should have modern aesthetics and a polished user interface
10. Include clear instructions on how to play

Focus on creating a high-quality gaming experience with:
- EXCEPTIONAL GRAPHICS using only procedurally generated or code-based visuals:
  - For 2D: Use SVG paths, Canvas API drawing, and CSS effects (NO base64)
  - For 3D: Use Three.js primitives, procedural geometry, and built-in materials
- Sophisticated artwork using code-based generation techniques:
  - Procedural patterns using math functions (sine waves, noise algorithms, etc.)
  - Programmatically generated gradients and color schemes
  - Particle systems and dynamic effects created with code
  - Geometric patterns and shapes combined to create complex visuals
- Proper initialization of libraries and modules:
  - For Three.js: Import modules using correct paths (e.g., 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/loaders/GLTFLoader.js')
  - Verify all imports work before using features
  - Include fallbacks or graceful degradation if any feature doesn't load
- Ensure clean initialization and shutdown:
  - Proper initialization of the game
  - Clean event handling
  - Resource management and cleanup

FOR SVG GRAPHICS:
- Use <svg> elements with paths, shapes, and gradients
- Create complex visuals by combining basic shapes
- Use SVG filters and effects for sophisticated looks
- Animate SVG elements for dynamic visuals

FOR CANVAS GRAPHICS:
- Use the Canvas API to draw shapes, lines, and patterns
- Implement algorithms for procedural generation
- Create textures and patterns mathematically

FOR CSS GRAPHICS:
- Use CSS gradients, shadows, and transforms
- Create complex shapes using clip-path and multiple elements
- Use CSS animations and transitions for effects

AGAIN: RETURN ONLY VALID HTML CODE. YOUR ENTIRE RESPONSE MUST BE A VALID HTML DOCUMENT STARTING WITH <!DOCTYPE html>. NO MARKDOWN CODE BLOCKS, NO EXPLANATIONS, NO COMMENTS OUTSIDE OF THE HTML, JUST PURE HTML CODE.`;

export async function POST(request: Request) {
  try {
    const { prompt, existingGame } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get the OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // If we have existing game code and this is a refinement request
    const messages = existingGame 
      ? [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'assistant', content: existingGame },
          { role: 'user', content: `Please update the game with the following changes. IMPORTANT: 1) DO NOT use base64 images or external resources - create all graphics using SVG, Canvas or CSS directly. 2) Ensure proper initialization of all libraries. 3) YOUR RESPONSE MUST BE ONLY THE HTML DOCUMENT WITH NO EXPLANATIONS OR TEXT BEFORE OR AFTER. Just output the raw HTML file: ${prompt}` }
        ]
      : [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${prompt} - REMEMBER: YOUR RESPONSE MUST BE ONLY THE HTML DOCUMENT WITH NO EXPLANATIONS OR MARKDOWN.` }
        ];

    // Choose the best model for game generation
    const chooseModel = () => {
      // Get optional model parameter, if specified
      const urlParams = new URL(request.url).searchParams;
      const modelParam = urlParams.get('model');
      
      if (modelParam) {
        return modelParam;
      }
      
      // Default models in order of preference for game generation
      return 'openai/gpt-4-turbo-preview'; // GPT-4 Turbo - excellent code generation
      
      // Other good options:
      // 'anthropic/claude-3-opus'      // Claude 3 Opus - very capable
      // 'google/gemini-1.5-pro'        // Gemini 1.5 Pro - good for creative tasks
      // 'anthropic/claude-3-sonnet'    // Claude 3 Sonnet - good balance of capability/speed
      // 'meta/llama-3-70b-instruct'    // Llama 3 70B - open source option
    };

    // Make the request to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', // Required for OpenRouter
        'X-Title': 'ARCADE AI Game Generator' // Optional for OpenRouter
      },
      body: JSON.stringify({
        model: chooseModel(),
        messages: messages,
        max_tokens: 400000, // Adjust based on game complexity
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to generate game with OpenRouter' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the generated HTML from the response
    let generatedHtml = data.choices[0]?.message?.content || '';
    
    // Clean up the response if it still contains markdown code blocks
    if (generatedHtml.includes('```html')) {
      const htmlMatch = generatedHtml.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch && htmlMatch[1]) {
        generatedHtml = htmlMatch[1].trim();
      }
    } else if (generatedHtml.includes('```')) {
      const codeMatch = generatedHtml.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch && codeMatch[1]) {
        generatedHtml = codeMatch[1].trim();
      }
    }

    // Ensure it starts with DOCTYPE if needed
    if (!generatedHtml.trim().startsWith('<!DOCTYPE') && !generatedHtml.trim().startsWith('<html')) {
      generatedHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>Generated Game</title>\n</head>\n<body>\n${generatedHtml}\n</body>\n</html>`;
    }

    // Return the cleaned game HTML and which model was used
    return NextResponse.json({ 
      gameHtml: generatedHtml, 
      model: data.model || chooseModel()
    });
  } catch (error) {
    console.error('Error generating game:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating game' },
      { status: 500 }
    );
  }
} 