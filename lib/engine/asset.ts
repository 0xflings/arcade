/**
 * Asset.ts
 * Manages game assets including images, sprites, and JSON data
 */

export type AssetType = 'image' | 'spritesheet' | 'json' | 'binary';

export interface Asset {
  id: string;
  url: string;
  type: AssetType;
  loaded: boolean;
  data: any;
  error?: string;
}

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Sprite {
  image: HTMLImageElement;
  frames: SpriteFrame[];
  currentFrame: number;
  frameTime: number;
  animationTime: number;
  loop: boolean;
}

export interface AssetOptions {
  type?: AssetType;
}

export class AssetManager {
  private assets: Map<string, Asset> = new Map();
  private sprites: Map<string, Sprite> = new Map();
  private loadPromises: Map<string, Promise<Asset>> = new Map();
  private baseUrl: string = '';
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Set the base URL for all assets
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
  
  /**
   * Get the full URL for an asset
   */
  private getFullUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${this.baseUrl}${url}`;
  }
  
  /**
   * Load an asset
   */
  async loadAsset(id: string, url: string, options: AssetOptions = {}): Promise<Asset> {
    // Return existing asset if already loaded
    if (this.assets.has(id)) {
      return this.assets.get(id)!;
    }
    
    // Return existing promise if already loading
    if (this.loadPromises.has(id)) {
      return this.loadPromises.get(id)!;
    }
    
    // Determine asset type if not specified
    const type = options.type || this.inferTypeFromUrl(url);
    
    // Create new asset
    const asset: Asset = {
      id,
      url,
      type,
      loaded: false,
      data: null
    };
    
    this.assets.set(id, asset);
    
    // Create load promise
    const loadPromise = this.loadAssetData(asset);
    this.loadPromises.set(id, loadPromise);
    
    try {
      // Wait for asset to load
      const loadedAsset = await loadPromise;
      
      // Clear load promise
      this.loadPromises.delete(id);
      
      return loadedAsset;
    } catch (error) {
      // Clear load promise
      this.loadPromises.delete(id);
      
      // Update asset with error
      asset.error = error instanceof Error ? error.message : String(error);
      this.assets.set(id, asset);
      
      throw error;
    }
  }
  
  /**
   * Load the data for an asset
   */
  private async loadAssetData(asset: Asset): Promise<Asset> {
    const fullUrl = this.getFullUrl(asset.url);
    
    try {
      switch (asset.type) {
        case 'image':
          asset.data = await this.loadImage(fullUrl);
          break;
        case 'spritesheet':
          const spriteData = await this.loadJson(fullUrl);
          const imageUrl = this.getFullUrl(spriteData.imageUrl || spriteData.image || '');
          const image = await this.loadImage(imageUrl);
          asset.data = { image, frames: spriteData.frames };
          break;
        case 'json':
          asset.data = await this.loadJson(fullUrl);
          break;
        case 'binary':
          asset.data = await this.loadBinary(fullUrl);
          break;
        default:
          throw new Error(`Unknown asset type: ${asset.type}`);
      }
      
      asset.loaded = true;
      this.assets.set(asset.id, asset);
      
      return asset;
    } catch (error) {
      asset.error = error instanceof Error ? error.message : String(error);
      this.assets.set(asset.id, asset);
      throw error;
    }
  }
  
  /**
   * Load an image
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      
      image.src = url;
    });
  }
  
  /**
   * Load a JSON file
   */
  private async loadJson(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${url} (${response.status} ${response.statusText})`);
    }
    return response.json();
  }
  
  /**
   * Load a binary file
   */
  private async loadBinary(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load binary: ${url} (${response.status} ${response.statusText})`);
    }
    return response.arrayBuffer();
  }
  
  /**
   * Infer asset type from URL
   */
  private inferTypeFromUrl(url: string): AssetType {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.gif') || lowerUrl.endsWith('.webp')) {
      return 'image';
    }
    
    if (lowerUrl.endsWith('.json')) {
      if (lowerUrl.includes('spritesheet') || lowerUrl.includes('sprite-sheet') || lowerUrl.includes('sprite_sheet')) {
        return 'spritesheet';
      }
      return 'json';
    }
    
    return 'binary';
  }
  
  /**
   * Get an asset by ID
   */
  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }
  
  /**
   * Get an image asset
   */
  getImage(id: string): HTMLImageElement | null {
    const asset = this.assets.get(id);
    if (!asset || !asset.loaded || asset.type !== 'image') {
      return null;
    }
    return asset.data;
  }
  
  /**
   * Get JSON data from an asset
   */
  getJson(id: string): any {
    const asset = this.assets.get(id);
    if (!asset || !asset.loaded || asset.type !== 'json') {
      return null;
    }
    return asset.data;
  }
  
  /**
   * Create a sprite from a spritesheet
   */
  createSprite(id: string, spritesheetId: string, options: {
    frameWidth?: number;
    frameHeight?: number;
    frames?: SpriteFrame[];
    frameTime?: number;
    loop?: boolean;
  } = {}): boolean {
    const asset = this.assets.get(spritesheetId);
    if (!asset || !asset.loaded || (asset.type !== 'spritesheet' && asset.type !== 'image')) {
      return false;
    }
    
    let image: HTMLImageElement;
    let frames: SpriteFrame[] = [];
    
    if (asset.type === 'spritesheet') {
      image = asset.data.image;
      frames = options.frames || asset.data.frames || [];
      
      // Generate frames if not provided and frame dimensions are specified
      if (frames.length === 0 && options.frameWidth && options.frameHeight) {
        const cols = Math.floor(image.width / options.frameWidth);
        const rows = Math.floor(image.height / options.frameHeight);
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            frames.push({
              x: col * options.frameWidth,
              y: row * options.frameHeight,
              width: options.frameWidth,
              height: options.frameHeight
            });
          }
        }
      }
    } else {
      // Use the entire image as a single frame
      image = asset.data;
      frames = [{
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      }];
    }
    
    if (frames.length === 0) {
      return false;
    }
    
    const sprite: Sprite = {
      image,
      frames,
      currentFrame: 0,
      frameTime: options.frameTime || 0.1, // 100ms per frame default
      animationTime: 0,
      loop: options.loop !== undefined ? options.loop : true
    };
    
    this.sprites.set(id, sprite);
    return true;
  }
  
  /**
   * Get a sprite by ID
   */
  getSprite(id: string): Sprite | null {
    return this.sprites.get(id) || null;
  }
  
  /**
   * Update sprite animations
   */
  updateSprites(deltaTime: number): void {
    this.sprites.forEach(sprite => {
      if (sprite.frames.length <= 1) return;
      
      sprite.animationTime += deltaTime;
      
      if (sprite.animationTime >= sprite.frameTime) {
        sprite.currentFrame = (sprite.currentFrame + 1) % sprite.frames.length;
        
        // If not looping and reached the end, stay on the last frame
        if (!sprite.loop && sprite.currentFrame === 0) {
          sprite.currentFrame = sprite.frames.length - 1;
        }
        
        sprite.animationTime = 0;
      }
    });
  }
  
  /**
   * Draw a sprite on the context
   */
  drawSprite(ctx: CanvasRenderingContext2D, spriteId: string, x: number, y: number, width?: number, height?: number, flipped: boolean = false): void {
    const sprite = this.sprites.get(spriteId);
    
    // Try using a direct image if sprite not found
    if (!sprite) {
      const img = this.getImage(spriteId);
      if (img) {
        console.log(`Drawing direct image for ${spriteId}`);
        try {
          if (flipped) {
            ctx.save();
            ctx.translate(x + (width || img.width), y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0, width || img.width, height || img.height);
            ctx.restore();
          } else {
            ctx.drawImage(img, x, y, width || img.width, height || img.height);
          }
        } catch (e) {
          console.error(`Error drawing image ${spriteId}:`, e);
          this.drawFallbackRect(ctx, x, y, width || 32, height || 32, spriteId);
        }
        return;
      } else {
        console.warn(`No sprite or image found for ${spriteId}`);
        this.drawFallbackRect(ctx, x, y, width || 32, height || 32, spriteId);
        return;
      }
    }
    
    const frame = sprite.frames[sprite.currentFrame];
    if (!frame) {
      console.warn(`No frame found for sprite ${spriteId}`);
      this.drawFallbackRect(ctx, x, y, width || 32, height || 32, spriteId);
      return;
    }
    
    const renderWidth = width || frame.width;
    const renderHeight = height || frame.height;
    
    try {
      if (flipped) {
        // Draw flipped horizontally
        ctx.save();
        ctx.translate(x + renderWidth, y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          sprite.image,
          frame.x, frame.y, frame.width, frame.height,
          0, 0, renderWidth, renderHeight
        );
        ctx.restore();
      } else {
        // Draw normally
        ctx.drawImage(
          sprite.image,
          frame.x, frame.y, frame.width, frame.height,
          x, y, renderWidth, renderHeight
        );
      }
    } catch (e) {
      console.error(`Error drawing sprite ${spriteId}:`, e);
      this.drawFallbackRect(ctx, x, y, renderWidth, renderHeight, spriteId);
    }
  }
  
  /**
   * Draw a fallback colored rectangle based on sprite ID
   */
  private drawFallbackRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, spriteId: string): void {
    // Choose color based on sprite ID
    let color = '#FF00FF'; // Default pink
    
    if (spriteId.includes('player')) {
      color = '#FF00FF'; // Pink for player
    } else if (spriteId.includes('enemy')) {
      color = '#FF0000'; // Red for enemies
    } else if (spriteId.includes('collectible')) {
      color = '#FFFF00'; // Yellow for collectibles
    } else if (spriteId.includes('platform')) {
      color = '#555555'; // Gray for platforms
    }
    
    // Draw the rectangle
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }
  
  /**
   * Preload multiple assets
   */
  async preloadAssets(assets: { id: string, url: string, options?: AssetOptions }[]): Promise<void> {
    const loadPromises = assets.map(asset => 
      this.loadAsset(asset.id, asset.url, asset.options)
    );
    
    await Promise.all(loadPromises);
  }
  
  /**
   * Check if all specified assets are loaded
   */
  areAssetsLoaded(ids: string[]): boolean {
    return ids.every(id => {
      const asset = this.assets.get(id);
      return asset && asset.loaded;
    });
  }
  
  /**
   * Unload an asset (remove from memory)
   */
  unloadAsset(id: string): boolean {
    if (!this.assets.has(id)) return false;
    
    // Remove from assets map
    this.assets.delete(id);
    
    // Remove any sprites using this asset
    this.sprites.forEach((sprite, spriteId) => {
      if (sprite.image === this.getImage(id)) {
        this.sprites.delete(spriteId);
      }
    });
    
    return true;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.assets.clear();
    this.sprites.clear();
    this.loadPromises.clear();
  }
} 