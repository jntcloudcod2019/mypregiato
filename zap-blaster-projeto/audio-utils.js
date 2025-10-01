/**
 * ============================================================================
 * UTILITÁRIOS DE ÁUDIO - ZAP BOT
 * ============================================================================
 * 
 * Biblioteca para processamento de áudio no WhatsApp Bot:
 * - Validação de formatos
 * - Análise de metadata
 * - Conversão para API
 * ============================================================================
 */

const fs = require('fs');

class AudioProcessor {
  
  /**
   * Formatos de áudio suportados pelo WhatsApp
   */
  static SUPPORTED_FORMATS = [
    'audio/mpeg',    // MP3
    'audio/ogg',     // OGG
    'audio/aac',     // AAC
    'audio/mp4',     // M4A
    'audio/amr',     // AMR (notas de voz)
    'audio/wav'      // WAV
  ];

  /**
   * Tamanho máximo de arquivo (16MB)
   */
  static MAX_FILE_SIZE = 16 * 1024 * 1024;

  /**
   * Duração máxima (30 minutos)
   */
  static MAX_DURATION = 30 * 60;

  /**
   * Detecta tipo de áudio a partir dos primeiros bytes
   */
  static detectAudioType(buffer) {
    if (!buffer || buffer.length < 12) {
      return null;
    }

    // MP3 - Frame header ou ID3
    if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
      return 'audio/mpeg';
    }
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) { // ID3
      return 'audio/mpeg';
    }

    // WAV - RIFF header
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'audio/wav';
    }

    // OGG - OggS
    if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      return 'audio/ogg';
    }

    // M4A/AAC - ftyp
    if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
      return 'audio/mp4';
    }

    // AMR - #!AMR
    if (buffer[0] === 0x23 && buffer[1] === 0x21 && buffer[2] === 0x41 && buffer[3] === 0x4D && buffer[4] === 0x52) {
      return 'audio/amr';
    }

    return 'audio/mpeg'; // Default para MP3
  }

  /**
   * Valida se o arquivo de áudio é suportado
   */
  static validateAudio(buffer, mimeType) {
    const result = {
      isValid: false,
      mimeType: mimeType,
      size: buffer.length,
      error: null
    };

    // Verifica tamanho
    if (buffer.length > this.MAX_FILE_SIZE) {
      result.error = `Arquivo muito grande. Máximo ${this.MAX_FILE_SIZE / 1024 / 1024}MB`;
      return result;
    }

    // Detecta tipo se não fornecido
    if (!mimeType) {
      result.mimeType = this.detectAudioType(buffer);
    }

    // Verifica se é suportado
    if (!this.SUPPORTED_FORMATS.includes(result.mimeType)) {
      result.error = `Formato não suportado: ${result.mimeType}`;
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Converte áudio para formato Opus OGG usando FFmpeg
   * @param {string} inputPath - Caminho do arquivo de entrada
   * @param {string} outputPath - Caminho do arquivo de saída (.ogg)
   * @param {object} options - Opções de conversão { ar, ac, bitrate }
   * @returns {Promise<boolean>} - true se conversão bem-sucedida
   */
  static async convertToOpus(inputPath, outputPath, options = {}) {
    const { spawn } = require('child_process');
    const fs = require('fs');
    
    // Opções padrão otimizadas para mensagens de voz
    const sampleRate = options.ar || 16000;  // 16kHz (qualidade voz)
    const channels = options.ac || 1;        // Mono
    const bitrate = options.bitrate || '24k'; // 24kbps (adequado para voz)
    
    // Validar se FFmpeg está disponível
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    
    return new Promise((resolve, reject) => {
      console.log('🎵 [AUDIO] Iniciando conversão para Opus', {
        input: inputPath,
        output: outputPath,
        sampleRate,
        channels,
        bitrate,
        ffmpegPath
      });
      
      // Comando FFmpeg para converter para OGG/Opus
      const args = [
        '-i', inputPath,           // Input
        '-c:a', 'libopus',         // Codec Opus
        '-ar', sampleRate.toString(), // Sample rate
        '-ac', channels.toString(),   // Canais (mono)
        '-b:a', bitrate,           // Bitrate
        '-vbr', 'on',              // Variable bitrate
        '-compression_level', '10', // Máxima compressão
        '-application', 'voip',    // Otimizado para voz
        '-y',                      // Sobrescrever arquivo existente
        outputPath                 // Output
      ];
      
      const ffmpeg = spawn(ffmpegPath, args);
      
      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          console.log('✅ [AUDIO] Conversão para Opus concluída', {
            outputSize: stats.size,
            outputPath
          });
          resolve(true);
        } else {
          console.error('❌ [AUDIO] Conversão para Opus falhou', {
            code,
            stderr: stderr.substring(0, 500)
          });
          resolve(false);
        }
      });
      
      ffmpeg.on('error', (error) => {
        console.error('❌ [AUDIO] Erro ao executar FFmpeg', {
          error: error.message,
          ffmpegPath
        });
        resolve(false);
      });
    });
  }

  /**
   * Processa mensagem de áudio do WhatsApp Web.js
   */
  static async processWhatsAppAudio(message) {
    try {
      console.log('🎵 Processando áudio WhatsApp...');
      
      // Dados básicos
      const audioData = {
        externalMessageId: message.id.id,
        from: message.from,
        fromNormalized: message.from.replace(/[^\d]/g, ''),
        to: message.to,
        type: 'audio',
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        instanceId: 'zap-blaster-001',
        fromMe: message.fromMe,
        isGroup: message.from.includes('@g.us'),
        body: '', // Áudios não têm texto
        chatId: message.from,
        simulated: false
      };

      // Processar attachment
      if (message.hasMedia) {
        console.log('🎵 Baixando mídia do áudio...');
        const media = await message.downloadMedia();
        
        if (media) {
          // Validar áudio
          const buffer = Buffer.from(media.data, 'base64');
          const validation = this.validateAudio(buffer, media.mimetype);
          
          if (!validation.isValid) {
            console.error('🎵 Áudio inválido:', validation.error);
            return null;
          }

          // Gerar nome do arquivo
          const timestamp = Date.now();
          const extension = this.getExtensionFromMimeType(validation.mimeType);
          const fileName = `audio_${timestamp}.${extension}`;

          // Montar attachment
          audioData.attachment = {
            dataUrl: `data:${validation.mimeType};base64,${media.data}`,
            mediaUrl: null, // Será definido pela API se usar storage externo
            mimeType: validation.mimeType,
            fileName: fileName,
            mediaType: 'audio',
            fileSize: validation.size,
            duration: null, // WhatsApp Web.js não fornece duração
            width: null,
            height: null,
            thumbnail: null
          };

          console.log('🎵 Áudio processado:', {
            fileName,
            mimeType: validation.mimeType,
            size: validation.size,
            isValid: validation.isValid
          });

          return audioData;
        }
      }

      console.warn('🎵 Mensagem de áudio sem mídia');
      return null;
      
    } catch (error) {
      console.error('🎵 Erro ao processar áudio:', error);
      return null;
    }
  }

  /**
   * Obtém extensão do arquivo a partir do MIME type
   */
  static getExtensionFromMimeType(mimeType) {
    const extensions = {
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/aac': 'aac',
      'audio/mp4': 'm4a',
      'audio/amr': 'amr',
      'audio/wav': 'wav'
    };
    
    return extensions[mimeType] || 'mp3';
  }

  /**
   * Gera estatísticas do áudio
   */
  static getAudioStats(buffer, mimeType) {
    return {
      size: buffer.length,
      sizeFormatted: this.formatFileSize(buffer.length),
      mimeType: mimeType,
      isValid: this.validateAudio(buffer, mimeType).isValid,
      detectedType: this.detectAudioType(buffer)
    };
  }

  /**
   * Formata tamanho do arquivo
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, index);
    
    return `${size.toFixed(1)} ${units[index]}`;
  }

  /**
   * Log de debug para áudio
   */
  static logAudioDebug(audioData, label = 'Audio') {
    console.log(`🎵 === ${label} Debug ===`);
    console.log(`📱 From: ${audioData.from}`);
    console.log(`📱 To: ${audioData.to}`);
    console.log(`🎧 Type: ${audioData.type}`);
    console.log(`📁 File: ${audioData.attachment?.fileName}`);
    console.log(`🗂️ MIME: ${audioData.attachment?.mimeType}`);
    console.log(`📏 Size: ${audioData.attachment?.fileSize} bytes`);
    console.log(`🔗 Has DataURL: ${!!audioData.attachment?.dataUrl}`);
    console.log(`⏱️ Timestamp: ${audioData.timestamp}`);
    console.log('🎵 ===========================');
  }
}

module.exports = AudioProcessor;
