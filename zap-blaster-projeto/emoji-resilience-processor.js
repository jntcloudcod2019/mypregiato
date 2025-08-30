/**
 * ============================================================================
 * PROCESSADOR DE RESILIÊNCIA PARA EMOJIS E CARACTERES ESPECIAIS
 * ============================================================================
 * 
 * Implementa múltiplas estratégias para garantir que emojis e caracteres
 * especiais não quebrem o processamento de mensagens.
 * 
 * ABORDAGENS DISPONÍVEIS:
 * 1. Sanitização Preventiva
 * 2. Fallback com Placeholder
 * 3. Encoding Seguro
 * 4. Validação Robusta
 * ============================================================================
 */

class EmojiResilienceProcessor {
    constructor(strategy = 'safe-encoding') {
        this.strategy = strategy;
        this.stats = {
            processed: 0,
            emojisFound: 0,
            sanitizations: 0,
            fallbacks: 0,
            encodingIssues: 0
        };

        // Padrões regex para diferentes tipos de caracteres problemáticos
        this.patterns = {
            // Emojis completos (incluindo sequências ZWJ)
            emoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu,
            
            // Caracteres de controle problemáticos
            control: /[\u0000-\u001F\u007F-\u009F]/g,
            
            // Caracteres não-printáveis
            nonPrintable: /[\u200B-\u200D\uFEFF]/g,
            
            // Surrogates órfãos (problemáticos em UTF-16)
            orphanSurrogate: /[\uD800-\uDFFF]/g,
            
            // Zero-width characters
            zeroWidth: /[\u200B\u200C\u200D\u2060\uFEFF]/g
        };

        console.log(`[EmojiResilience] 🛡️ Inicializado com estratégia: ${strategy}`);
    }

    /**
     * Processa texto aplicando a estratégia de resiliência escolhida
     */
    processText(text, options = {}) {
        if (!text || typeof text !== 'string') {
            return { processed: '', safe: true, issues: [] };
        }

        this.stats.processed++;

        const result = {
            original: text,
            processed: text,
            safe: true,
            issues: [],
            metadata: {
                originalLength: text.length,
                hasEmojis: false,
                emojiCount: 0,
                encoding: 'utf8'
            }
        };

        try {
            // Detectar emojis primeiro
            result.metadata.hasEmojis = this.hasEmojis(text);
            result.metadata.emojiCount = this.countEmojis(text);

            if (result.metadata.hasEmojis) {
                this.stats.emojisFound++;
            }

            // Aplicar estratégia escolhida
            switch (this.strategy) {
                case 'sanitize':
                    result.processed = this.sanitizeText(text, result);
                    break;
                    
                case 'placeholder':
                    result.processed = this.replaceWithPlaceholder(text, result);
                    break;
                    
                case 'safe-encoding':
                    result.processed = this.applySafeEncoding(text, result);
                    break;
                    
                case 'preserve':
                    result.processed = this.preserveWithValidation(text, result);
                    break;
                    
                case 'hybrid':
                    result.processed = this.applyHybridStrategy(text, result);
                    break;
                    
                default:
                    result.processed = this.applySafeEncoding(text, result);
            }

            // Validação final
            this.validateProcessedText(result);

        } catch (error) {
            console.error(`[EmojiResilience] ❌ Erro no processamento:`, error);
            result.processed = this.createFallbackText(text);
            result.safe = false;
            result.issues.push(`Erro de processamento: ${error.message}`);
            this.stats.fallbacks++;
        }

        return result;
    }

    // === ESTRATÉGIA 1: SANITIZAÇÃO ===
    sanitizeText(text, result) {
        let processed = text;

        // Remover caracteres de controle
        processed = processed.replace(this.patterns.control, '');
        
        // Remover caracteres não-printáveis
        processed = processed.replace(this.patterns.nonPrintable, '');
        
        // Remover surrogates órfãos
        processed = processed.replace(this.patterns.orphanSurrogate, '');
        
        // Remover zero-width characters
        processed = processed.replace(this.patterns.zeroWidth, '');

        if (processed !== text) {
            result.issues.push('Caracteres problemáticos removidos');
            this.stats.sanitizations++;
        }

        return processed;
    }

    // === ESTRATÉGIA 2: PLACEHOLDER ===
    replaceWithPlaceholder(text, result) {
        let processed = text;
        let replacements = 0;

        // Substituir emojis por placeholder textual
        processed = processed.replace(this.patterns.emoji, (match) => {
            replacements++;
            return `[emoji:${this.getEmojiName(match)}]`;
        });

        // Limpar outros caracteres problemáticos
        processed = this.sanitizeText(processed, result);

        if (replacements > 0) {
            result.issues.push(`${replacements} emojis substituídos por placeholders`);
            result.metadata.emojiPlaceholders = replacements;
        }

        return processed;
    }

    // === ESTRATÉGIA 3: ENCODING SEGURO ===
    applySafeEncoding(text, result) {
        try {
            // Converter para Buffer e validar UTF-8
            const buffer = Buffer.from(text, 'utf8');
            let processed = buffer.toString('utf8');

            // Verificar se a conversão foi bem-sucedida
            if (Buffer.from(processed, 'utf8').toString('utf8') !== processed) {
                throw new Error('Encoding UTF-8 inválido');
            }

            // Aplicar normalização Unicode (NFC)
            processed = processed.normalize('NFC');

            // Truncar se necessário (respeitando caracteres multibyte)
            if (processed.length > 4000) { // Limite MySQL TEXT
                processed = this.safeTruncate(processed, 3900);
                result.issues.push('Texto truncado para evitar overflow');
            }

            result.metadata.encoding = 'utf8-validated';
            return processed;

        } catch (error) {
            console.warn(`[EmojiResilience] ⚠️ Problema de encoding: ${error.message}`);
            this.stats.encodingIssues++;
            
            // Fallback: remover caracteres problemáticos
            return this.sanitizeText(text, result);
        }
    }

    // === ESTRATÉGIA 4: PRESERVAR COM VALIDAÇÃO ===
    preserveWithValidation(text, result) {
        // Manter emojis mas validar estrutura
        let processed = text;

        try {
            // Validar que todos os emojis são válidos
            const emojiMatches = [...text.matchAll(this.patterns.emoji)];
            
            for (const match of emojiMatches) {
                const emoji = match[0];
                if (!this.isValidEmoji(emoji)) {
                    result.issues.push(`Emoji inválido detectado: ${emoji}`);
                    processed = processed.replace(emoji, '�'); // Replacement character
                }
            }

            // Aplicar normalização
            processed = processed.normalize('NFC');

            // Validar JSON serialization
            JSON.stringify({ test: processed });

        } catch (error) {
            result.issues.push(`Validação falhou: ${error.message}`);
            return this.applySafeEncoding(text, result);
        }

        return processed;
    }

    // === ESTRATÉGIA 5: HÍBRIDA ===
    applyHybridStrategy(text, result) {
        // Combina múltiplas abordagens baseado no conteúdo
        
        const emojiCount = this.countEmojis(text);
        const hasProblematicChars = this.hasProblematicCharacters(text);

        if (emojiCount === 0 && !hasProblematicChars) {
            // Texto simples - apenas validação básica
            return this.applySafeEncoding(text, result);
        }

        if (emojiCount > 10) {
            // Muitos emojis - usar placeholder para evitar problemas
            result.issues.push('Muitos emojis detectados - usando placeholders');
            return this.replaceWithPlaceholder(text, result);
        }

        if (hasProblematicChars) {
            // Caracteres problemáticos - sanitizar primeiro
            const sanitized = this.sanitizeText(text, result);
            return this.preserveWithValidation(sanitized, result);
        }

        // Casos normais - preservar com validação
        return this.preserveWithValidation(text, result);
    }

    // === MÉTODOS UTILITÁRIOS ===

    hasEmojis(text) {
        return this.patterns.emoji.test(text);
    }

    countEmojis(text) {
        const matches = text.match(this.patterns.emoji);
        return matches ? matches.length : 0;
    }

    hasProblematicCharacters(text) {
        return (
            this.patterns.control.test(text) ||
            this.patterns.nonPrintable.test(text) ||
            this.patterns.orphanSurrogate.test(text) ||
            this.patterns.zeroWidth.test(text)
        );
    }

    isValidEmoji(emoji) {
        try {
            // Verificar se o emoji pode ser serializado e deserializado
            const serialized = JSON.stringify(emoji);
            const deserialized = JSON.parse(serialized);
            return deserialized === emoji && emoji.length > 0;
        } catch {
            return false;
        }
    }

    getEmojiName(emoji) {
        // Mapeamento básico de emojis para nomes
        const emojiMap = {
            '😀': 'grinning',
            '😂': 'laughing',
            '❤️': 'heart',
            '👍': 'thumbs-up',
            '🔥': 'fire',
            '💯': 'hundred'
        };

        return emojiMap[emoji] || `U+${emoji.codePointAt(0).toString(16).toUpperCase()}`;
    }

    safeTruncate(text, maxLength) {
        if (text.length <= maxLength) return text;

        // Truncar sem quebrar caracteres multibyte
        let truncated = text.substring(0, maxLength);
        
        // Verificar se o último caractere é válido
        const lastChar = truncated[truncated.length - 1];
        const lastCharCode = lastChar.charCodeAt(0);
        
        // Se for um surrogate, remover para evitar caractere órfão
        if (lastCharCode >= 0xD800 && lastCharCode <= 0xDFFF) {
            truncated = truncated.substring(0, truncated.length - 1);
        }

        return truncated + '...';
    }

    validateProcessedText(result) {
        try {
            // Teste de serialização JSON
            JSON.stringify({ text: result.processed });
            
            // Teste de encoding UTF-8
            Buffer.from(result.processed, 'utf8').toString('utf8');
            
            // Verificar se não há surrogates órfãos
            if (this.patterns.orphanSurrogate.test(result.processed)) {
                throw new Error('Surrogates órfãos detectados');
            }

            result.metadata.validatedAt = new Date().toISOString();

        } catch (error) {
            result.safe = false;
            result.issues.push(`Validação final falhou: ${error.message}`);
        }
    }

    createFallbackText(originalText) {
        // Texto de fallback extremamente seguro
        const fallback = originalText
            .replace(/[^\x00-\x7F]/g, '?') // Manter apenas ASCII
            .substring(0, 100); // Truncar agressivamente
        
        return fallback || '[Mensagem com caracteres especiais]';
    }

    // === MÉTODOS DE DIAGNÓSTICO ===

    analyzeText(text) {
        return {
            length: text.length,
            byteLength: Buffer.byteLength(text, 'utf8'),
            hasEmojis: this.hasEmojis(text),
            emojiCount: this.countEmojis(text),
            hasProblematic: this.hasProblematicCharacters(text),
            canSerializeJSON: (() => {
                try { JSON.stringify(text); return true; } catch { return false; }
            })(),
            isValidUTF8: (() => {
                try { 
                    return Buffer.from(text, 'utf8').toString('utf8') === text;
                } catch { return false; }
            })()
        };
    }

    getStats() {
        return { ...this.stats };
    }

    resetStats() {
        Object.keys(this.stats).forEach(key => this.stats[key] = 0);
    }
}

module.exports = EmojiResilienceProcessor;
