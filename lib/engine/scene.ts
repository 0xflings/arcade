/**
 * Scene.ts
 * Defines the Scene class for managing collections of entities and game logic
 */

import { Entity } from './entity';
import { Physics } from './physics';
import { Renderer } from './renderer';

export interface SceneOptions {
  name: string;
  gravity?: number;
  friction?: number;
  backgroundColor?: string;
}

export class Scene {
  name: string;
  entities: Map<string, Entity>;
  physics: Physics;
  backgroundColor: string;
  private entitiesToAdd: Entity[];
  private entitiesToRemove: string[];
  private isUpdating: boolean;

  constructor(options: SceneOptions) {
    this.name = options.name;
    this.entities = new Map();
    this.physics = new Physics({
      gravity: options.gravity,
      friction: options.friction
    });
    this.backgroundColor = options.backgroundColor || '#000';
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
    this.isUpdating = false;
  }

  // Add an entity to the scene
  addEntity(entity: Entity): Entity {
    if (this.isUpdating) {
      this.entitiesToAdd.push(entity);
      return entity;
    }
    
    this.entities.set(entity.id, entity);
    return entity;
  }

  // Remove an entity from the scene
  removeEntity(entityId: string): void {
    if (this.isUpdating) {
      this.entitiesToRemove.push(entityId);
      return;
    }
    
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.destroy();
      this.entities.delete(entityId);
    }
  }

  // Get an entity by ID
  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  // Get entities by tag
  getEntitiesByTag(tag: string): Entity[] {
    const result: Entity[] = [];
    this.entities.forEach(entity => {
      if (entity.hasTag(tag)) {
        result.push(entity);
      }
    });
    return result;
  }

  // Update all entities in the scene
  update(deltaTime: number): void {
    this.isUpdating = true;
    
    // Process physics for all active entities
    const physicsEntities: Entity[] = [];
    const platformEntities: Entity[] = [];
    
    // First collect all entities for processing
    this.entities.forEach(entity => {
      if (entity.active) {
        // Update entity logic
        entity.update(deltaTime);
        
        // Separate platforms from other entities for optimized collision
        if (entity.hasTag('platform')) {
          platformEntities.push(entity);
        } else {
          physicsEntities.push(entity);
        }
      }
    });
    
    // Process physics
    physicsEntities.forEach(entity => {
      // Update physics for entity
      this.physics.update(entity);
      
      // Check collisions with other physics entities
      this.physics.checkCollisions(entity, physicsEntities);
      
      // Check collisions with platforms
      this.physics.checkCollisions(entity, platformEntities);
    });
    
    this.isUpdating = false;
    
    // Process pending entity additions and removals
    this.processPendingEntities();
  }

  // Render all entities in the scene
  render(renderer: Renderer): void {
    // Clear the background
    renderer.clear();
    
    // Render all visible entities
    const renderableEntities: Entity[] = [];
    
    this.entities.forEach(entity => {
      if (entity.visible) {
        renderableEntities.push(entity);
      }
    });
    
    // Sort entities by z-index or y position for proper layering
    // In this simple version, we'll sort by y position for a basic depth effect
    renderableEntities.sort((a, b) => a.y - b.y);
    
    // Render sorted entities
    renderer.renderEntities(renderableEntities);
  }

  // Process pending entity additions and removals
  private processPendingEntities(): void {
    // Add pending entities
    while (this.entitiesToAdd.length > 0) {
      const entity = this.entitiesToAdd.pop();
      if (entity) {
        this.entities.set(entity.id, entity);
      }
    }
    
    // Remove pending entities
    while (this.entitiesToRemove.length > 0) {
      const entityId = this.entitiesToRemove.pop();
      if (entityId) {
        const entity = this.entities.get(entityId);
        if (entity) {
          entity.destroy();
          this.entities.delete(entityId);
        }
      }
    }
  }

  // Clear all entities from the scene
  clear(): void {
    this.entities.forEach(entity => {
      entity.destroy();
    });
    
    this.entities.clear();
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
  }

  // Check if the scene contains an entity with the given ID
  hasEntity(entityId: string): boolean {
    return this.entities.has(entityId);
  }

  // Get the count of entities in the scene
  getEntityCount(): number {
    return this.entities.size;
  }
} 