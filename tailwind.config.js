/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        'arcade-black': '#0A0A0A',
        'neon-pink': '#FF00FF',
        'electric-blue': '#00FFFF',
        'arcade-yellow': '#FFFF00',
        'neon-green': '#00FF00',
        
        // Secondary colors
        'dark-purple': '#330033',
        'deep-blue': '#000033',
        'metallic-silver': '#C0C0C0',
        'crt-green': '#33FF33',
        'pixel-red': '#FF0000',
      },
      borderColor: {
        'metallic-silver': '#C0C0C0',
        'deep-blue': '#000033',
        'arcade-black': '#0A0A0A',
        'neon-pink': '#FF00FF',
      },
      fontFamily: {
        'heading': ['"Press Start 2P"', 'cursive'],
        'body': ['"VT323"', 'monospace'],
        'ui': ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}; 