/**
 * Template registry - imports all game templates to ensure they're registered 
 */

// Import all templates to trigger their registration
import './platformer';
import './shooter';
import './puzzle';

// Export the template base types
export * from './template'; 