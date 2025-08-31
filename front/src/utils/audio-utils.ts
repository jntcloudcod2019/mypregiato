/**
 * ============================================================================
 * UTILITÁRIOS DE ÁUDIO - SUPORTE COMPLETO
 * ============================================================================
 * 
 * Biblioteca personalizada para manipulação de áudio em aplicações WhatsApp:
 * - Validação de formatos
 * - Conversão e compressão
 * - Player customizado
 * - Análise de metadata
 * ============================================================================
 */

export enum AudioFormat {
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav', 
  OGG = 'audio/ogg',
  AAC = 'audio/aac',
  M4A = 'audio/mp4',
  WEBM = 'audio/webm'
}

export interface AudioMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  size: number;
  format: AudioFormat;
  isValid: boolean;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Classe principal para manipulação de áudio
 */
export class AudioProcessor {
  
  /**
   * Formatos suportados pelo WhatsApp
   */
  static readonly SUPPORTED_FORMATS = [
    AudioFormat.MP3,
    AudioFormat.OGG,
    AudioFormat.AAC,
    AudioFormat.M4A
  ];

  /**
   * Tamanho máximo permitido (16MB)
   */
  static readonly MAX_FILE_SIZE = 16 * 1024 * 1024;

  /**
   * Duração máxima permitida (30 minutos)
   */
  static readonly MAX_DURATION = 30 * 60;

  /**
   * Valida se um arquivo de áudio é suportado
   */
  static validateAudioFile(file: File): { isValid: boolean; error?: string } {
    // Verifica tamanho
    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `Arquivo muito grande. Máximo ${this.MAX_FILE_SIZE / 1024 / 1024}MB.` 
      };
    }

    // Verifica formato
    if (!this.SUPPORTED_FORMATS.includes(file.type as AudioFormat)) {
      return { 
        isValid: false, 
        error: `Formato não suportado. Use: ${this.SUPPORTED_FORMATS.join(', ')}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Converte arquivo para base64
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove prefixo data:audio/...;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Analisa metadata de áudio a partir de base64
   */
  static async analyzeAudioMetadata(base64Data: string, mimeType: string): Promise<AudioMetadata> {
    try {
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      const audio = new Audio();
      
      return new Promise<AudioMetadata>((resolve) => {
        const metadata: AudioMetadata = {
          size: Math.ceil(base64Data.length * 0.75), // Aproximação do tamanho real
          format: mimeType as AudioFormat,
          isValid: this.SUPPORTED_FORMATS.includes(mimeType as AudioFormat)
        };

        audio.addEventListener('loadedmetadata', () => {
          metadata.duration = audio.duration;
          metadata.isValid = metadata.isValid && !isNaN(audio.duration);
          resolve(metadata);
        });

        audio.addEventListener('error', () => {
          metadata.isValid = false;
          resolve(metadata);
        });

        // Timeout para evitar travamento
        setTimeout(() => {
          if (metadata.duration === undefined) {
            metadata.isValid = false;
            resolve(metadata);
          }
        }, 5000);

        audio.src = dataUrl;
      });
    } catch (error) {
      return {
        size: Math.ceil(base64Data.length * 0.75),
        format: mimeType as AudioFormat,
        isValid: false
      };
    }
  }

  /**
   * Detecta formato de áudio a partir dos primeiros bytes
   */
  static detectAudioFormat(base64Data: string): AudioFormat | null {
    try {
      // Converte primeiros bytes para análise
      const binaryString = atob(base64Data.substring(0, 100));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Detecta MP3
      if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) {
        return AudioFormat.MP3;
      }
      if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) { // ID3
        return AudioFormat.MP3;
      }

      // Detecta WAV
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        return AudioFormat.WAV;
      }

      // Detecta OGG
      if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
        return AudioFormat.OGG;
      }

      // Detecta M4A/AAC
      if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        return AudioFormat.M4A;
      }

      return null;
    } catch (error) {
      console.error('Erro ao detectar formato:', error);
      return null;
    }
  }

  /**
   * Formata duração em MM:SS
   */
  static formatDuration(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formata tamanho do arquivo
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, index);
    
    return `${size.toFixed(1)} ${units[index]}`;
  }

  /**
   * Verifica se o navegador suporta o formato
   */
  static canPlayFormat(format: AudioFormat): boolean {
    const audio = document.createElement('audio');
    const canPlay = audio.canPlayType(format);
    return canPlay === 'probably' || canPlay === 'maybe';
  }

  /**
   * Comprime áudio (reduz qualidade para economizar bandwidth)
   */
  static async compressAudio(
    file: File, 
    targetBitrate: number = 128
  ): Promise<{ file: File; originalSize: number; compressedSize: number }> {
    // Para compressão real, seria necessário usar Web Audio API ou uma biblioteca
    // Por enquanto, retorna o arquivo original como fallback
    console.warn('Compressão de áudio não implementada. Usando arquivo original.');
    
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size
    };
  }
}

/**
 * Hook personalizado para player de áudio
 */
export class AudioPlayer {
  private audio: HTMLAudioElement;
  private listeners: { [event: string]: (() => void)[] } = {};

  constructor(src?: string) {
    this.audio = new Audio(src);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const events = [
      'loadstart', 'loadeddata', 'loadedmetadata', 'canplay', 'canplaythrough',
      'play', 'pause', 'ended', 'timeupdate', 'volumechange', 'error'
    ];

    events.forEach(event => {
      this.audio.addEventListener(event, () => {
        this.emit(event);
      });
    });
  }

  on(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: () => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }

  // Métodos de controle
  async play() {
    try {
      await this.audio.play();
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      throw error;
    }
  }

  pause() {
    this.audio.pause();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  // Getters/Setters
  get currentTime() { return this.audio.currentTime; }
  set currentTime(time: number) { this.audio.currentTime = time; }

  get duration() { return this.audio.duration || 0; }
  get volume() { return this.audio.volume; }
  set volume(vol: number) { this.audio.volume = Math.max(0, Math.min(1, vol)); }

  get muted() { return this.audio.muted; }
  set muted(muted: boolean) { this.audio.muted = muted; }

  get paused() { return this.audio.paused; }
  get ended() { return this.audio.ended; }
  
  get readyState() { return this.audio.readyState; }
  get src() { return this.audio.src; }
  set src(src: string) { this.audio.src = src; }

  // Cleanup
  destroy() {
    this.audio.pause();
    this.audio.src = '';
    this.listeners = {};
  }
}

/**
 * Utilitários para debug de áudio
 */
export class AudioDebugger {
  static logAudioInfo(audio: HTMLAudioElement, label: string = 'Audio') {
    console.group(`🎵 ${label} Debug Info`);
    console.log('Src:', audio.src);
    console.log('Duration:', audio.duration);
    console.log('Current Time:', audio.currentTime);
    console.log('Ready State:', audio.readyState);
    console.log('Network State:', audio.networkState);
    console.log('Volume:', audio.volume);
    console.log('Muted:', audio.muted);
    console.log('Paused:', audio.paused);
    console.log('Ended:', audio.ended);
    console.groupEnd();
  }

  static async testAudioSupport() {
    console.group('🎵 Teste de Suporte a Áudio');
    
    const formats = Object.values(AudioFormat);
    const audio = document.createElement('audio');
    
    formats.forEach(format => {
      const support = audio.canPlayType(format);
      console.log(`${format}: ${support || 'não suportado'}`);
    });
    
    console.groupEnd();
  }
}

export default AudioProcessor;
