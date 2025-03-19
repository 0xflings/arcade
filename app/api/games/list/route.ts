import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/services/gameService';

// GET /api/games/list - List games with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const authorName = searchParams.get('author') || undefined;
    const featuredStr = searchParams.get('featured');
    
    // Convert featured string to boolean
    let isFeatured: boolean | undefined = undefined;
    if (featuredStr !== null) {
      isFeatured = featuredStr === 'true';
    }
    
    const games = await GameService.listGames(limit, authorName, isFeatured);
    
    return NextResponse.json({
      success: true,
      data: games
    });
  } catch (error: any) {
    console.error('Error listing games:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
} 