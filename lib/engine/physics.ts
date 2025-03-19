/**
 * Physics.ts
 * Handles game physics, collisions, gravity, and movement
 */

export interface PhysicsOptions {
  gravity: number;
  friction: number;
  terminalVelocity: number;
  bounceCoefficient: number;
}

export interface PhysicsObject {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  acceleration: number;
  gravity?: number;
  friction?: number;
  solid: boolean;
  bouncy?: boolean;
  bounceCoefficient?: number;
  onGround?: boolean;
  mass?: number;
}

export interface CollisionResult {
  collided: boolean;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  overlap?: number;
}

export class Physics {
  private gravity: number;
  private friction: number;
  private terminalVelocity: number;
  private defaultBounceCoefficient: number;

  constructor(options: Partial<PhysicsOptions> = {}) {
    this.gravity = options.gravity ?? 0.5;
    this.friction = options.friction ?? 0.8;
    this.terminalVelocity = options.terminalVelocity ?? 10;
    this.defaultBounceCoefficient = options.bounceCoefficient ?? 0.3;
  }

  // Apply physics updates to an object
  update(entity: PhysicsObject): void {
    // Store previous position for collision resolution
    const previousY = entity.y;
    
    // Apply gravity if not on ground
    if (!entity.onGround) {
      entity.velocityY += entity.gravity ?? this.gravity;
    }

    // Apply friction
    if (entity.onGround) {
      entity.velocityX *= entity.friction ?? this.friction;
      
      // Clamp very small velocity values to zero to prevent sliding
      if (Math.abs(entity.velocityX) < 0.1) {
        entity.velocityX = 0;
      }
    }

    // Apply terminal velocity
    if (entity.velocityY > this.terminalVelocity) {
      entity.velocityY = this.terminalVelocity;
    }

    // Apply velocity to position
    entity.x += entity.velocityX;
    entity.y += entity.velocityY;
    
    // If entity moved significantly downward without a collision,
    // it's probably falling, so mark as not on ground
    if (entity.y - previousY > 1 && entity.onGround) {
      entity.onGround = false;
    }
  }

  // Detect collision between two objects
  detectCollision(a: PhysicsObject, b: PhysicsObject): CollisionResult {
    // No collision if either object is not solid
    if (!a.solid || !b.solid) {
      return { collided: false };
    }

    // Calculate collision bounds
    const aLeft = a.x;
    const aRight = a.x + a.width;
    const aTop = a.y;
    const aBottom = a.y + a.height;

    const bLeft = b.x;
    const bRight = b.x + b.width;
    const bTop = b.y;
    const bBottom = b.y + b.height;

    // Check if bounds overlap
    if (aRight <= bLeft || aLeft >= bRight || aBottom <= bTop || aTop >= bBottom) {
      return { collided: false };
    }

    // Calculate overlap in each direction
    const overlapLeft = aRight - bLeft;
    const overlapRight = bRight - aLeft;
    const overlapTop = aBottom - bTop;
    const overlapBottom = bBottom - aTop;

    // Find the smallest overlap to determine collision direction
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    let direction: 'top' | 'bottom' | 'left' | 'right';
    
    // For platforms, prioritize top collision when falling
    if (b.hasOwnProperty('tags') && (b as any).tags?.includes('platform') && a.velocityY > 0) {
      // If entity is falling and the top overlap is reasonable, prioritize top collision
      if (overlapTop < a.height / 2) {
        direction = 'top';
      } else if (minOverlap === overlapLeft) {
        direction = 'left';
      } else if (minOverlap === overlapRight) {
        direction = 'right';
      } else if (minOverlap === overlapBottom) {
        direction = 'bottom';
      } else {
        direction = 'top';
      }
    } else {
      // Normal collision resolution for non-platform objects
      if (minOverlap === overlapTop) {
        direction = 'top';
      } else if (minOverlap === overlapBottom) {
        direction = 'bottom';
      } else if (minOverlap === overlapLeft) {
        direction = 'left';
      } else {
        direction = 'right';
      }
    }

    return {
      collided: true,
      direction,
      overlap: minOverlap
    };
  }

  // Resolve collision between two objects
  resolveCollision(a: PhysicsObject, b: PhysicsObject, result: CollisionResult): void {
    if (!result.collided || !result.direction || !result.overlap) return;

    const bounceCoefficient = a.bouncy 
      ? (a.bounceCoefficient ?? this.defaultBounceCoefficient) 
      : 0;

    switch (result.direction) {
      case 'top':
        // Only set onGround if entity is actually falling or near zero velocity
        if (a.velocityY >= 0) {
          a.y = b.y - a.height;
          // Reset velocity to prevent micro-bouncing
          a.velocityY = 0;
          a.onGround = true;
        }
        break;
      case 'bottom':
        a.y = b.y + b.height;
        a.velocityY = -a.velocityY * bounceCoefficient;
        break;
      case 'left':
        a.x = b.x - a.width;
        a.velocityX = -a.velocityX * bounceCoefficient;
        break;
      case 'right':
        a.x = b.x + b.width;
        a.velocityX = -a.velocityX * bounceCoefficient;
        break;
    }
  }

  // Check if an object is colliding with any object in an array
  checkCollisions(entity: PhysicsObject, others: PhysicsObject[]): void {
    for (const other of others) {
      if (entity === other) continue;
      
      const result = this.detectCollision(entity, other);
      if (result.collided) {
        this.resolveCollision(entity, other, result);
      }
    }
  }

  // Check if a point is inside an object
  isPointInside(x: number, y: number, object: PhysicsObject): boolean {
    return (
      x >= object.x &&
      x <= object.x + object.width &&
      y >= object.y &&
      y <= object.y + object.height
    );
  }

  // Apply a force to an object
  applyForce(entity: PhysicsObject, forceX: number, forceY: number): void {
    const mass = entity.mass ?? 1;
    entity.velocityX += forceX / mass;
    entity.velocityY += forceY / mass;
  }

  // Apply an impulse (immediate velocity change)
  applyImpulse(entity: PhysicsObject, impulseX: number, impulseY: number): void {
    entity.velocityX = impulseX;
    entity.velocityY = impulseY;
  }
} 