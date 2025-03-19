/**
 * Input handler for keyboard and touch controls
 */

// Rename InputHandler to InputManager for consistency with our architecture
export class InputManager {
  // Keyboard state
  private keys: Map<string, boolean> = new Map();
  private keysPrevious: Map<string, boolean> = new Map();
  private keysJustPressed: Map<string, boolean> = new Map();
  private keysJustReleased: Map<string, boolean> = new Map();
  
  // Touch state
  private touchStart: { x: number, y: number } | null = null;
  private touchEnd: { x: number, y: number } | null = null;
  private touchThreshold: number = 30; // Minimum distance for swipe detection
  
  // Virtual buttons for touch controls
  private virtualButtons: VirtualButton[] = [];
  
  // Target element for event listeners
  private targetElement: HTMLElement;
  
  // Input state
  private active: boolean = false;
  
  constructor(targetElement: HTMLElement) {
    this.targetElement = targetElement;
  }
  
  /**
   * Start listening for input events
   */
  start(): void {
    if (this.active) return;
    
    this.active = true;
    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }
  
  /**
   * Stop listening for input events
   */
  stop(): void {
    if (!this.active) return;
    
    this.active = false;
    this.removeKeyboardListeners();
    this.removeTouchListeners();
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.keys.clear();
    this.keysPrevious.clear();
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.virtualButtons = [];
  }

  /**
   * Set up keyboard event listeners
   */
  private setupKeyboardListeners(): void {
    // Use event binding to maintain proper 'this' context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.preventDefaultKeys = this.preventDefaultKeys.bind(this);
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('keydown', this.preventDefaultKeys);
  }
  
  /**
   * Remove keyboard event listeners
   */
  private removeKeyboardListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('keydown', this.preventDefaultKeys);
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.set(e.code, true);
  }

  /**
   * Handle keyup events
   */
  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.set(e.code, false);
  }

  /**
   * Prevent default behavior for game control keys
   */
  private preventDefaultKeys(e: KeyboardEvent): void {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }
  
  /**
   * Set up touch event listeners
   */
  private setupTouchListeners(): void {
    // Use event binding to maintain proper 'this' context
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    
    this.targetElement.addEventListener('touchstart', this.handleTouchStart);
    this.targetElement.addEventListener('touchmove', this.handleTouchMove);
    this.targetElement.addEventListener('touchend', this.handleTouchEnd);
  }
  
  /**
   * Remove touch event listeners
   */
  private removeTouchListeners(): void {
    this.targetElement.removeEventListener('touchstart', this.handleTouchStart);
    this.targetElement.removeEventListener('touchmove', this.handleTouchMove);
    this.targetElement.removeEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY
    };
    this.touchEnd = null;
    
    // Check for virtual button presses
    this.checkVirtualButtonPress(touch.clientX, touch.clientY, true);
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(e: TouchEvent): void {
    const touch = e.touches[0];
    this.touchEnd = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    // Prevent scrolling when swiping on game area
    e.preventDefault();
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(): void {
    // Reset virtual button presses
    this.checkVirtualButtonPress(0, 0, false);
  }
  
  /**
   * Update the input state (should be called once per frame)
   */
  update(): void {
    // Update key states for just pressed/released detection
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    
    this.keys.forEach((isPressed, key) => {
      const wasPressedPreviously = this.keysPrevious.get(key) || false;
      
      if (isPressed && !wasPressedPreviously) {
        this.keysJustPressed.set(key, true);
      } else if (!isPressed && wasPressedPreviously) {
        this.keysJustReleased.set(key, true);
      }
      
      // Update previous state for next frame
      this.keysPrevious.set(key, isPressed);
    });
  }
  
  /**
   * Add a virtual button for touch controls
   */
  addVirtualButton(button: VirtualButton): void {
    this.virtualButtons.push(button);
  }
  
  /**
   * Check if a key is currently pressed
   */
  isKeyDown(key: string): boolean {
    return this.keys.get(key) === true;
  }
  
  /**
   * Check if a key was just pressed this frame
   */
  isKeyJustPressed(key: string): boolean {
    return this.keysJustPressed.get(key) === true;
  }
  
  /**
   * Check if a key was just released this frame
   */
  isKeyJustReleased(key: string): boolean {
    return this.keysJustReleased.get(key) === true;
  }
  
  /**
   * Get all currently pressed keys
   */
  getInputs(): Set<string> {
    const result = new Set<string>();
    this.keys.forEach((isPressed, key) => {
      if (isPressed) {
        result.add(key);
      }
    });
    return result;
  }
  
  /**
   * Get horizontal input axis (-1 to 1)
   */
  getHorizontalAxis(): number {
    let axis = 0;
    
    if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) {
      axis -= 1;
    }
    
    if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) {
      axis += 1;
    }
    
    // Check for touch swipe left/right
    if (this.touchStart && this.touchEnd) {
      const dx = this.touchEnd.x - this.touchStart.x;
      if (Math.abs(dx) > this.touchThreshold) {
        axis = Math.sign(dx);
      }
    }
    
    // Check for virtual directional buttons
    this.virtualButtons.forEach(button => {
      if (button.pressed) {
        if (button.action === 'left') axis -= 1;
        if (button.action === 'right') axis += 1;
      }
    });
    
    return Math.max(-1, Math.min(1, axis)); // Clamp between -1 and 1
  }
  
  /**
   * Get vertical input axis (-1 to 1)
   */
  getVerticalAxis(): number {
    let axis = 0;
    
    if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) {
      axis -= 1;
    }
    
    if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) {
      axis += 1;
    }
    
    // Check for touch swipe up/down
    if (this.touchStart && this.touchEnd) {
      const dy = this.touchEnd.y - this.touchStart.y;
      if (Math.abs(dy) > this.touchThreshold) {
        axis = Math.sign(dy);
      }
    }
    
    // Check for virtual directional buttons
    this.virtualButtons.forEach(button => {
      if (button.pressed) {
        if (button.action === 'up') axis -= 1;
        if (button.action === 'down') axis += 1;
      }
    });
    
    return Math.max(-1, Math.min(1, axis)); // Clamp between -1 and 1
  }
  
  /**
   * Check if jump button is pressed
   */
  isJumpPressed(): boolean {
    const keyboardJump = this.isKeyDown('Space') || this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW');
    
    // Check for virtual jump button
    const touchJump = this.virtualButtons.some(button => button.action === 'jump' && button.pressed);
    
    return keyboardJump || touchJump;
  }
  
  /**
   * Check if action button is pressed
   */
  isActionPressed(): boolean {
    const keyboardAction = this.isKeyDown('Enter') || this.isKeyDown('KeyE');
    
    // Check for virtual action button
    const touchAction = this.virtualButtons.some(button => button.action === 'action' && button.pressed);
    
    return keyboardAction || touchAction;
  }
  
  /**
   * Check if a touch press is on a virtual button
   */
  private checkVirtualButtonPress(x: number, y: number, isPress: boolean): void {
    this.virtualButtons.forEach(button => {
      if (isPress) {
        // Check if touch is inside button
        if (
          x >= button.x && 
          x <= button.x + button.width && 
          y >= button.y && 
          y <= button.y + button.height
        ) {
          button.pressed = true;
        }
      } else {
        // Release all buttons on touch end
        button.pressed = false;
      }
    });
  }
  
  /**
   * Render virtual buttons for touch controls
   */
  renderVirtualButtons(ctx: CanvasRenderingContext2D): void {
    this.virtualButtons.forEach(button => {
      // Draw button
      ctx.fillStyle = button.pressed ? button.pressedColor : button.color;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(button.x, button.y, button.width, button.height);
      ctx.globalAlpha = 1.0;
      
      // Draw label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2);
    });
  }
}

/**
 * Virtual button for touch controls
 */
export interface VirtualButton {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  pressedColor: string;
  label: string;
  action: 'left' | 'right' | 'up' | 'down' | 'jump' | 'action';
  pressed: boolean;
} 