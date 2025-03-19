import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/services/gameService';

// GET /api/games/:id - Get a game by ID
export async function GET(request: NextRequest) {
  // Extract the game ID from the URL
  const id = request.url.split('/').pop() || '';
  
  try {
    const game = await GameService.loadGame(id);
    
    return NextResponse.json({
      success: true,
      data: game.serialize()
    });
  } catch (error: any) {
    console.error(`Error loading game ${id}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 404 }
    );
  }
}

// PUT /api/games/:id - Update a game
export async function PUT(request: NextRequest) {
  // Extract the game ID from the URL
  const id = request.url.split('/').pop() || '';
  
  try {
    const body = await request.json();
    
    // First load the existing game
    const existingGame = await GameService.loadGame(id);
    
    // Apply updates
    if (body.parameters) {
      const template = existingGame.getTemplate();
      const newGame = template.createGame(body.parameters);
      newGame.setId(existingGame.getId());
      newGame.setMetadata(existingGame.getMetadata());
      
      // Update the game
      const metadata = {
        title: body.title,
        description: body.description,
        authorName: body.authorName
      };
      
      const updatedGame = await GameService.updateGame(id, newGame, metadata);
      
      return NextResponse.json({
        success: true,
        data: updatedGame.serialize()
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'No parameters provided for update'
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error(`Error updating game ${id}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE /api/games/:id - Delete a game
export async function DELETE(request: NextRequest) {
  // Extract the game ID from the URL
  const id = request.url.split('/').pop() || '';
  
  try {
    await GameService.deleteGame(id);
    
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error(`Error deleting game ${id}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
} 