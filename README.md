<div align="center">
  <img src="https://github.com/x0FlyHigh/ARCADE/blob/main/public/favicon.png?raw=true" alt="Banner" />
</div>

<div align="center">
  <a href="https://x.com/arcadeai_sol" target="_blank">Twitter</a> <br/>
  <a href="https://www.arcadeai.fun/" target="_blank">Website</a>
  CA: COMING SOON
</div>


ARCADE is an AI-powered web application that lets users generate, play, and share fully functional browser-based games. Using a simple prompt, users can have an AI generate a complete game powered by our custom browser-based game engine. They can then edit or fork the game, rate and comment on creations, and share their favorite games with a shareable URL.

## Features

- **AI Game Generation:**  
  Enter a detailed game prompt and have the AI generate a complete, error-free game that runs directly in your browser using our custom game engine.

- **Custom Game Engine:** x 
  Built specifically for browser games with support for physics, animations, sprite management, input handling, and sound effects, enabling a wide range of game types.

- **Fork & Edit:**  
  Fork any existing game to create a modified version. The fork history is tracked, so you can view and load previous versions.

- **Ratings & Comments:**  
  Rate games on a 5-star scale and leave comments for feedback and community discussion.

- **User Management:**  
  Save your game creations with your username. View creations filtered by user and see a distinct list of users.

- **Shareable Links:**  
  Easily generate and copy a shareable URL so others can load your game directly from their browser.

- **Pagination & Search:**  
  Efficiently browse game creations with search functionality and pagination to avoid loading thousands of records at once.

- **Arcade-themed UI:**  
  Built with Next.js 13, TypeScript, and Tailwind CSS, and animated with Framer Motion for a nostalgic arcade-inspired look and feel.

## Requirements

- **API Key:**  
  You need an API key for the AI service (e.g. OpenAI). This key must be provided via environment variables.

- **Supabase Account:**  
  Set up a Supabase project for your backend database and storage needs.

- **Vercel AI SDK:**  
  The project uses Vercel's AI SDK to interface with the AI API.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/x0FlyHigh/ARCADE.git
cd ARCADE
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project and add the following:

```env
# API Key for your AI service (e.g. OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

### 4. Set Up the Database Schema

Run the following SQL scripts in your Supabase SQL editor to create (or update) the necessary tables:

#### Games Table

```sql
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  game_data JSONB NOT NULL,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_game_id UUID REFERENCES games(id),
  is_featured BOOLEAN DEFAULT false
);
```

#### Comments Table

```sql
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Ratings Table

```sql
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Running the Project

To start the development server, run:

```bash
npm run dev
```

Then open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Game Engine

ARCADE features a custom browser-based game engine with the following components:

- **Core Engine:** Main game loop and lifecycle management
- **Renderer:** Visual rendering system optimized for pixel art and 2D graphics
- **Physics:** 2D physics system with collision detection
- **Input:** Support for keyboard and touch controls
- **Entity:** Component-based entity system for game objects
- **Scene:** Management for groups of entities
- **Sound:** Web Audio API integration for music and sound effects
- **Asset:** Image, spritesheet, and JSON data management

The engine supports multiple game templates including platformers, shooters, and puzzle games.

## Deployment

Deploy your project to Vercel (or your preferred hosting provider) by connecting your GitHub repository and configuring your environment variables in the deployment settings.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with any improvements or bug fixes.

## Acknowledgements

- [Next.js 13](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Supabase](https://supabase.com/)
- [Vercel AI SDK](https://vercel.com/docs/concepts/ai)
