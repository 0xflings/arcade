/**
 * Sound.ts
 * Manages game audio including sound effects and background music
 */

export interface Sound {
  id: string;
  url: string;
  buffer?: AudioBuffer;
  loaded: boolean;
  loop?: boolean;
  volume?: number;
}

export interface SoundOptions {
  volume?: number;
  loop?: boolean;
}

export class SoundManager {
  private context: AudioContext | null = null;
  private sounds: Map<string, Sound> = new Map();
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();
  private backgroundMusic: AudioBufferSourceNode | null = null;
  private backgroundMusicId: string | null = null;
  private masterVolume: number = 1.0;
  private muted: boolean = false;
  private gainNode: GainNode | null = null;
  
  constructor() {
    // Create audio context on user interaction to comply with browser autoplay policies
  }
  
  /**
   * Initialize the audio context (should be called on user interaction)
   */
  initialize(): boolean {
    if (this.context) return true;
    
    try {
      // Create new audio context
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = this.masterVolume;
      this.gainNode.connect(this.context.destination);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }
  
  /**
   * Load a sound file
   */
  async loadSound(id: string, url: string, options: SoundOptions = {}): Promise<boolean> {
    if (!this.context) {
      if (!this.initialize()) return false;
    }
    
    // Don't load if already loaded
    if (this.sounds.has(id)) return true;
    
    try {
      const sound: Sound = {
        id,
        url,
        loaded: false,
        loop: options.loop || false,
        volume: options.volume !== undefined ? options.volume : 1.0
      };
      
      this.sounds.set(id, sound);
      
      // Load sound file
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
      
      sound.buffer = audioBuffer;
      sound.loaded = true;
      
      this.sounds.set(id, sound);
      return true;
    } catch (error) {
      console.error(`Failed to load sound ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Play a sound effect
   */
  playSound(id: string, options: SoundOptions = {}): string | null {
    if (!this.context || !this.gainNode) {
      if (!this.initialize()) return null;
    }
    
    const sound = this.sounds.get(id);
    if (!sound || !sound.buffer) {
      console.warn(`Sound ${id} not loaded`);
      return null;
    }
    
    try {
      // Create source node
      const source = this.context!.createBufferSource();
      source.buffer = sound.buffer;
      source.loop = options.loop !== undefined ? options.loop : sound.loop || false;
      
      // Create gain node for this sound's volume
      const gainNode = this.context!.createGain();
      const volume = options.volume !== undefined ? options.volume : sound.volume || 1.0;
      gainNode.gain.value = volume * (this.muted ? 0 : 1);
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.gainNode!);
      
      // Generate unique instance ID
      const instanceId = `${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Store active sound
      this.activeSounds.set(instanceId, source);
      
      // Auto-remove when finished
      source.onended = () => {
        this.activeSounds.delete(instanceId);
      };
      
      // Start playback
      source.start(0);
      
      return instanceId;
    } catch (error) {
      console.error(`Failed to play sound ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Stop a specific sound instance
   */
  stopSound(instanceId: string): boolean {
    const source = this.activeSounds.get(instanceId);
    if (!source) return false;
    
    try {
      source.stop();
      this.activeSounds.delete(instanceId);
      return true;
    } catch (error) {
      console.error(`Failed to stop sound ${instanceId}:`, error);
      return false;
    }
  }
  
  /**
   * Stop all sounds
   */
  stopAllSounds(): void {
    // Stop all active sounds
    this.activeSounds.forEach((source, id) => {
      try {
        source.stop();
      } catch (error) {
        console.error(`Failed to stop sound ${id}:`, error);
      }
    });
    
    this.activeSounds.clear();
    
    // Stop background music
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.stop();
        this.backgroundMusic = null;
        this.backgroundMusicId = null;
      } catch (error) {
        console.error('Failed to stop background music:', error);
      }
    }
  }
  
  /**
   * Play background music
   */
  playBackgroundMusic(id: string, options: SoundOptions = {}): boolean {
    if (!this.context || !this.gainNode) {
      if (!this.initialize()) return false;
    }
    
    // Stop current background music if playing
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.stop();
        this.backgroundMusic = null;
      } catch (error) {
        console.error('Failed to stop background music:', error);
      }
    }
    
    const sound = this.sounds.get(id);
    if (!sound || !sound.buffer) {
      console.warn(`Background music ${id} not loaded`);
      return false;
    }
    
    try {
      // Create source node
      const source = this.context!.createBufferSource();
      source.buffer = sound.buffer;
      source.loop = options.loop !== undefined ? options.loop : true; // Default to loop for background music
      
      // Create gain node for music volume
      const gainNode = this.context!.createGain();
      const volume = options.volume !== undefined ? options.volume : sound.volume || 0.5; // Default lower volume for BGM
      gainNode.gain.value = volume * (this.muted ? 0 : 1);
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.gainNode!);
      
      // Store background music
      this.backgroundMusic = source;
      this.backgroundMusicId = id;
      
      // Set callback for when music ends
      source.onended = () => {
        if (!source.loop) {
          this.backgroundMusic = null;
          this.backgroundMusicId = null;
        }
      };
      
      // Start playback
      source.start(0);
      
      return true;
    } catch (error) {
      console.error(`Failed to play background music ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Stop background music
   */
  stopBackgroundMusic(): boolean {
    if (!this.backgroundMusic) return false;
    
    try {
      this.backgroundMusic.stop();
      this.backgroundMusic = null;
      this.backgroundMusicId = null;
      return true;
    } catch (error) {
      console.error('Failed to stop background music:', error);
      return false;
    }
  }
  
  /**
   * Get the current background music ID
   */
  getBackgroundMusicId(): string | null {
    return this.backgroundMusicId;
  }
  
  /**
   * Set the master volume
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : this.masterVolume;
    }
  }
  
  /**
   * Get the master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }
  
  /**
   * Mute all sounds
   */
  mute(): void {
    this.muted = true;
    
    if (this.gainNode) {
      this.gainNode.gain.value = 0;
    }
  }
  
  /**
   * Unmute all sounds
   */
  unmute(): void {
    this.muted = false;
    
    if (this.gainNode) {
      this.gainNode.gain.value = this.masterVolume;
    }
  }
  
  /**
   * Check if audio is muted
   */
  isMuted(): boolean {
    return this.muted;
  }
  
  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
    
    return this.muted;
  }
  
  /**
   * Preload multiple sounds
   */
  async preloadSounds(sounds: { id: string, url: string, options?: SoundOptions }[]): Promise<void> {
    const loadPromises = sounds.map(sound => 
      this.loadSound(sound.id, sound.url, sound.options)
    );
    
    await Promise.all(loadPromises);
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAllSounds();
    
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
    }
    
    this.context = null;
    this.gainNode = null;
    this.sounds.clear();
    this.activeSounds.clear();
    this.backgroundMusic = null;
    this.backgroundMusicId = null;
  }
  
  /**
   * Check if a sound is loaded
   */
  isSoundLoaded(id: string): boolean {
    const sound = this.sounds.get(id);
    return !!sound && sound.loaded;
  }
  
  /**
   * Get all loaded sound IDs
   */
  getLoadedSounds(): string[] {
    const loadedSounds: string[] = [];
    
    this.sounds.forEach((sound, id) => {
      if (sound.loaded) {
        loadedSounds.push(id);
      }
    });
    
    return loadedSounds;
  }
} 