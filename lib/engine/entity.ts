/**
 * Entity.ts
 * Defines the base Entity class and related types for game objects
 */

import { PhysicsObject } from './physics';
import { Renderable } from './renderer';

export interface EntityOptions {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX?: number;
  velocityY?: number;
  acceleration?: number;
  gravity?: number;
  friction?: number;
  color?: string;
  solid?: boolean;
  bouncy?: boolean;
  bounceCoefficient?: number;
  mass?: number;
  tags?: string[];
  active?: boolean;
  visible?: boolean;
}

export interface Behavior {
  name: string;
  init?: (entity: Entity) => void;
  update?: (entity: Entity, deltaTime: number) => void;
  render?: (entity: Entity, ctx: CanvasRenderingContext2D) => void;
  onCollision?: (entity: Entity, other: Entity, direction: string) => void;
  onInput?: (entity: Entity, inputType: string, data: any) => void;
  destroy?: (entity: Entity) => void;
}

export class Entity implements PhysicsObject, Renderable {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  acceleration: number;
  gravity?: number;
  friction?: number;
  color: string;
  solid: boolean;
  bouncy: boolean;
  bounceCoefficient?: number;
  mass: number;
  tags: string[];
  active: boolean;
  visible: boolean;
  onGround: boolean;
  behaviors: Map<string, Behavior>;
  data: Map<string, any>;

  constructor(options: EntityOptions) {
    this.id = options.id || `entity_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.velocityX = options.velocityX || 0;
    this.velocityY = options.velocityY || 0;
    this.acceleration = options.acceleration || 0;
    this.gravity = options.gravity;
    this.friction = options.friction;
    this.color = options.color || '#fff';
    this.solid = options.solid !== undefined ? options.solid : true;
    this.bouncy = options.bouncy || false;
    this.bounceCoefficient = options.bounceCoefficient;
    this.mass = options.mass || 1;
    this.tags = options.tags || [];
    this.active = options.active !== undefined ? options.active : true;
    this.visible = options.visible !== undefined ? options.visible : true;
    this.onGround = false;
    this.behaviors = new Map();
    this.data = new Map();
  }

  // Update entity state
  update(deltaTime: number): void {
    // Skip update if inactive
    if (!this.active) return;

    // Run behavior updates
    this.behaviors.forEach(behavior => {
      if (behavior.update) {
        behavior.update(this, deltaTime);
      }
    });
  }

  // Render entity
  render(ctx: CanvasRenderingContext2D): void {
    // Skip rendering if invisible
    if (!this.visible) return;

    // Custom rendering via behaviors
    let customRender = false;
    this.behaviors.forEach(behavior => {
      if (behavior.render) {
        behavior.render(this, ctx);
        customRender = true;
      }
    });

    // Default rendering if no custom rendering behavior
    if (!customRender) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  // Handle collision with another entity
  handleCollision(other: Entity, direction: string): void {
    this.behaviors.forEach(behavior => {
      if (behavior.onCollision) {
        behavior.onCollision(this, other, direction);
      }
    });
  }

  // Handle input events
  handleInput(inputType: string, data: any): void {
    this.behaviors.forEach(behavior => {
      if (behavior.onInput) {
        behavior.onInput(this, inputType, data);
      }
    });
  }

  // Add a behavior to the entity
  addBehavior(behavior: Behavior): this {
    if (this.behaviors.has(behavior.name)) {
      this.removeBehavior(behavior.name);
    }
    
    this.behaviors.set(behavior.name, behavior);
    
    // Initialize behavior if it has an init method
    if (behavior.init) {
      behavior.init(this);
    }
    
    return this;
  }

  // Remove a behavior from the entity
  removeBehavior(name: string): this {
    const behavior = this.behaviors.get(name);
    if (behavior && behavior.destroy) {
      behavior.destroy(this);
    }
    
    this.behaviors.delete(name);
    return this;
  }

  // Check if entity has a behavior
  hasBehavior(name: string): boolean {
    return this.behaviors.has(name);
  }

  // Get a behavior by name
  getBehavior(name: string): Behavior | undefined {
    return this.behaviors.get(name);
  }

  // Set custom data on the entity
  setData(key: string, value: any): this {
    this.data.set(key, value);
    return this;
  }

  // Get custom data from the entity
  getData(key: string): any {
    return this.data.get(key);
  }

  // Check if entity has a tag
  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  // Add a tag to the entity
  addTag(tag: string): this {
    if (!this.hasTag(tag)) {
      this.tags.push(tag);
    }
    return this;
  }

  // Remove a tag from the entity
  removeTag(tag: string): this {
    this.tags = this.tags.filter(t => t !== tag);
    return this;
  }

  // Destroy the entity
  destroy(): void {
    // Call destroy on all behaviors
    this.behaviors.forEach(behavior => {
      if (behavior.destroy) {
        behavior.destroy(this);
      }
    });
    
    // Clear all references
    this.behaviors.clear();
    this.data.clear();
    this.active = false;
  }
} 