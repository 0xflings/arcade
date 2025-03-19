import { NextRequest, NextResponse } from 'next/server';
import { GameService, GameMetadata } from '@/lib/services/gameService';
import { GameTemplateManager } from '@/lib/templates/template';

// POST /api/games/save - Save a new game
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.templateId || !body.parameters) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: templateId and parameters'
        },
        { status: 400 }
      );
    }
    
    // Get the template
    const template = GameTemplateManager.getTemplateById(body.templateId);
    
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: `Template ${body.templateId} not found`
        },
        { status: 404 }
      );
    }
    
    // Create the game
    const game = template.createGame(body.parameters);
    
    // Set metadata including the prompt
    game.setMetadata({
      prompt: body.prompt || '',
      createdAt: new Date().toISOString(),
      editCount: 0
    });
    
    // Prepare metadata for saving
    const metadata: GameMetadata = {
      title: body.title || 'Untitled Game',
      description: body.description,
      authorName: body.authorName || 'Anonymous',
      parentGameId: body.parentGameId,
      isFeatured: body.isFeatured
    };
    
    // Save the game
    const savedGame = await GameService.saveGame(game, metadata);
    
    return NextResponse.json({
      success: true,
      data: {
        id: savedGame.getId(),
        ...savedGame.serialize()
      }
    });
  } catch (error: any) {
    console.error('Error saving game:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
} 