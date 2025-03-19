-- Migration to add game_config column to the games table
-- This column will store the configuration options used to generate the game

-- First, check if the column already exists to avoid errors
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'games' AND column_name = 'game_config'
  ) THEN
    -- Add the game_config column as JSONB to store the configuration options
    ALTER TABLE games ADD COLUMN game_config JSONB;
    
    -- Add a comment to the column
    COMMENT ON COLUMN games.game_config IS 'Game configuration options used for generation (difficulty, gameType, etc.)';
  END IF;
  
  -- Check if used_fallback column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'games' AND column_name = 'used_fallback'
  ) THEN
    -- Add used_fallback column to track when fallback generation was used
    ALTER TABLE games ADD COLUMN used_fallback BOOLEAN DEFAULT FALSE;
    
    -- Add a comment to the column
    COMMENT ON COLUMN games.used_fallback IS 'Indicates if fallback generation was used instead of AI';
  END IF;
END $$; 