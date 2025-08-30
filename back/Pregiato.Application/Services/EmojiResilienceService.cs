using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace Pregiato.Application.Services
{
    /// <summary>
    /// Serviço de resiliência para processamento de emojis e caracteres especiais
    /// Implementa múltiplas estratégias para garantir que emojis não quebrem o processamento
    /// </summary>
    public interface IEmojiResilienceService
    {
        EmojiProcessingResult ProcessText(string text, EmojiProcessingStrategy strategy = EmojiProcessingStrategy.Hybrid);
        bool IsTextSafe(string text);
        TextAnalysis AnalyzeText(string text);
        EmojiProcessingStats GetStats();
    }

    public class EmojiResilienceService : IEmojiResilienceService
    {
        private readonly ILogger<EmojiResilienceService> _logger;
        private readonly EmojiProcessingStats _stats;

        // Patterns para diferentes tipos de caracteres problemáticos
        private static readonly Regex EmojiPattern = new(@"[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]", RegexOptions.Compiled);
        private static readonly Regex ControlCharsPattern = new(@"[\u0000-\u001F\u007F-\u009F]", RegexOptions.Compiled);
        private static readonly Regex NonPrintablePattern = new(@"[\u200B-\u200D\uFEFF]", RegexOptions.Compiled);
        private static readonly Regex ZeroWidthPattern = new(@"[\u200B\u200C\u200D\u2060\uFEFF]", RegexOptions.Compiled);

        public EmojiResilienceService(ILogger<EmojiResilienceService> logger)
        {
            _logger = logger;
            _stats = new EmojiProcessingStats();
        }

        public EmojiProcessingResult ProcessText(string text, EmojiProcessingStrategy strategy = EmojiProcessingStrategy.Hybrid)
        {
            if (string.IsNullOrEmpty(text))
            {
                return new EmojiProcessingResult 
                { 
                    Processed = text ?? string.Empty, 
                    Safe = true,
                    Issues = new List<string>()
                };
            }

            _stats.Processed++;

            var result = new EmojiProcessingResult
            {
                Original = text,
                Processed = text,
                Safe = true,
                Issues = new List<string>(),
                Metadata = new EmojiProcessingMetadata
                {
                    OriginalLength = text.Length,
                    HasEmojis = HasEmojis(text),
                    EmojiCount = CountEmojis(text),
                    Encoding = "utf8"
                }
            };

            try
            {
                if (result.Metadata.HasEmojis)
                {
                    _stats.EmojisFound++;
                }

                // Aplicar estratégia escolhida
                result.Processed = strategy switch
                {
                    EmojiProcessingStrategy.Sanitize => SanitizeText(text, result),
                    EmojiProcessingStrategy.Placeholder => ReplaceWithPlaceholder(text, result),
                    EmojiProcessingStrategy.SafeEncoding => ApplySafeEncoding(text, result),
                    EmojiProcessingStrategy.Preserve => PreserveWithValidation(text, result),
                    EmojiProcessingStrategy.Hybrid => ApplyHybridStrategy(text, result),
                    _ => ApplySafeEncoding(text, result)
                };

                // Validação final
                ValidateProcessedText(result);

                _logger.LogDebug("Texto processado com estratégia {Strategy}: {OriginalLength} → {ProcessedLength} chars, emojis: {EmojiCount}",
                    strategy, result.Metadata.OriginalLength, result.Processed.Length, result.Metadata.EmojiCount);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no processamento de texto com estratégia {Strategy}", strategy);
                result.Processed = CreateFallbackText(text);
                result.Safe = false;
                result.Issues.Add($"Erro de processamento: {ex.Message}");
                _stats.Fallbacks++;
            }

            return result;
        }

        // === ESTRATÉGIA 1: SANITIZAÇÃO ===
        private string SanitizeText(string text, EmojiProcessingResult result)
        {
            var processed = text;

            // Remover caracteres de controle
            processed = ControlCharsPattern.Replace(processed, string.Empty);
            
            // Remover caracteres não-printáveis
            processed = NonPrintablePattern.Replace(processed, string.Empty);
            
            // Remover zero-width characters
            processed = ZeroWidthPattern.Replace(processed, string.Empty);

            if (processed != text)
            {
                result.Issues.Add("Caracteres problemáticos removidos");
                _stats.Sanitizations++;
            }

            return processed;
        }

        // === ESTRATÉGIA 2: PLACEHOLDER ===
        private string ReplaceWithPlaceholder(string text, EmojiProcessingResult result)
        {
            var replacements = 0;
            
            var processed = EmojiPattern.Replace(text, match =>
            {
                replacements++;
                return $"[emoji:{GetEmojiName(match.Value)}]";
            });

            // Limpar outros caracteres problemáticos
            processed = SanitizeText(processed, result);

            if (replacements > 0)
            {
                result.Issues.Add($"{replacements} emojis substituídos por placeholders");
                result.Metadata.EmojiPlaceholders = replacements;
            }

            return processed;
        }

        // === ESTRATÉGIA 3: ENCODING SEGURO ===
        private string ApplySafeEncoding(string text, EmojiProcessingResult result)
        {
            try
            {
                // Converter para bytes UTF-8 e validar
                var bytes = Encoding.UTF8.GetBytes(text);
                var processed = Encoding.UTF8.GetString(bytes);

                // Verificar se a conversão foi bem-sucedida
                if (!string.Equals(text, processed, StringComparison.Ordinal))
                {
                    throw new InvalidOperationException("Encoding UTF-8 inválido");
                }

                // Aplicar normalização Unicode (NFC)
                processed = processed.Normalize(NormalizationForm.FormC);

                // Truncar se necessário (respeitando caracteres multibyte)
                if (processed.Length > 4000) // Limite MySQL TEXT
                {
                    processed = SafeTruncate(processed, 3900);
                    result.Issues.Add("Texto truncado para evitar overflow");
                }

                result.Metadata.Encoding = "utf8-validated";
                return processed;

            }
            catch (Exception ex)
            {
                _logger.LogWarning("Problema de encoding: {Message}", ex.Message);
                _stats.EncodingIssues++;
                
                // Fallback: remover caracteres problemáticos
                return SanitizeText(text, result);
            }
        }

        // === ESTRATÉGIA 4: PRESERVAR COM VALIDAÇÃO ===
        private string PreserveWithValidation(string text, EmojiProcessingResult result)
        {
            try
            {
                // Aplicar normalização
                var processed = text.Normalize(NormalizationForm.FormC);

                // Validar JSON serialization
                JsonSerializer.Serialize(new { test = processed });

                // Validar que não há surrogates órfãos
                if (HasOrphanSurrogates(processed))
                {
                    result.Issues.Add("Surrogates órfãos detectados");
                    processed = RemoveOrphanSurrogates(processed);
                }

                return processed;
            }
            catch (Exception ex)
            {
                result.Issues.Add($"Validação falhou: {ex.Message}");
                return ApplySafeEncoding(text, result);
            }
        }

        // === ESTRATÉGIA 5: HÍBRIDA ===
        private string ApplyHybridStrategy(string text, EmojiProcessingResult result)
        {
            var emojiCount = CountEmojis(text);
            var hasProblematicChars = HasProblematicCharacters(text);

            if (emojiCount == 0 && !hasProblematicChars)
            {
                // Texto simples - apenas validação básica
                return ApplySafeEncoding(text, result);
            }

            if (emojiCount > 10)
            {
                // Muitos emojis - usar placeholder para evitar problemas
                result.Issues.Add("Muitos emojis detectados - usando placeholders");
                return ReplaceWithPlaceholder(text, result);
            }

            if (hasProblematicChars)
            {
                // Caracteres problemáticos - sanitizar primeiro
                var sanitized = SanitizeText(text, result);
                return PreserveWithValidation(sanitized, result);
            }

            // Casos normais - preservar com validação
            return PreserveWithValidation(text, result);
        }

        // === MÉTODOS UTILITÁRIOS ===

        public bool IsTextSafe(string text)
        {
            if (string.IsNullOrEmpty(text)) return true;

            try
            {
                // Verificar encoding UTF-8
                var bytes = Encoding.UTF8.GetBytes(text);
                var decoded = Encoding.UTF8.GetString(bytes);
                if (!string.Equals(text, decoded, StringComparison.Ordinal))
                    return false;

                // Verificar serialização JSON
                JsonSerializer.Serialize(new { test = text });

                // Verificar surrogates órfãos
                if (HasOrphanSurrogates(text))
                    return false;

                return true;
            }
            catch
            {
                return false;
            }
        }

        public TextAnalysis AnalyzeText(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return new TextAnalysis();
            }

            return new TextAnalysis
            {
                Length = text.Length,
                ByteLength = Encoding.UTF8.GetByteCount(text),
                HasEmojis = HasEmojis(text),
                EmojiCount = CountEmojis(text),
                HasProblematicChars = HasProblematicCharacters(text),
                CanSerializeJson = CanSerializeJson(text),
                IsValidUtf8 = IsValidUtf8(text),
                HasOrphanSurrogates = HasOrphanSurrogates(text)
            };
        }

        private bool HasEmojis(string text) => EmojiPattern.IsMatch(text);

        private int CountEmojis(string text) => EmojiPattern.Matches(text).Count;

        private bool HasProblematicCharacters(string text) =>
            ControlCharsPattern.IsMatch(text) ||
            NonPrintablePattern.IsMatch(text) ||
            ZeroWidthPattern.IsMatch(text);

        private bool HasOrphanSurrogates(string text)
        {
            for (int i = 0; i < text.Length; i++)
            {
                char c = text[i];
                if (char.IsHighSurrogate(c))
                {
                    if (i + 1 >= text.Length || !char.IsLowSurrogate(text[i + 1]))
                        return true;
                }
                else if (char.IsLowSurrogate(c))
                {
                    if (i == 0 || !char.IsHighSurrogate(text[i - 1]))
                        return true;
                }
            }
            return false;
        }

        private string RemoveOrphanSurrogates(string text)
        {
            var sb = new StringBuilder();
            for (int i = 0; i < text.Length; i++)
            {
                char c = text[i];
                if (char.IsHighSurrogate(c))
                {
                    if (i + 1 < text.Length && char.IsLowSurrogate(text[i + 1]))
                    {
                        sb.Append(c);
                        sb.Append(text[i + 1]);
                        i++; // Skip next char as it's part of the pair
                    }
                    // Skip orphan high surrogate
                }
                else if (char.IsLowSurrogate(c))
                {
                    // Skip orphan low surrogate
                }
                else
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }

        private bool CanSerializeJson(string text)
        {
            try
            {
                JsonSerializer.Serialize(new { test = text });
                return true;
            }
            catch
            {
                return false;
            }
        }

        private bool IsValidUtf8(string text)
        {
            try
            {
                var bytes = Encoding.UTF8.GetBytes(text);
                var decoded = Encoding.UTF8.GetString(bytes);
                return string.Equals(text, decoded, StringComparison.Ordinal);
            }
            catch
            {
                return false;
            }
        }

        private string GetEmojiName(string emoji)
        {
            // Mapeamento básico de emojis para nomes
            var emojiMap = new Dictionary<string, string>
            {
                ["😀"] = "grinning",
                ["😂"] = "laughing",
                ["❤️"] = "heart",
                ["👍"] = "thumbs-up",
                ["🔥"] = "fire",
                ["💯"] = "hundred"
            };

            if (emojiMap.TryGetValue(emoji, out var name))
                return name;

            // Fallback para código Unicode
            var codePoint = char.ConvertToUtf32(emoji, 0);
            return $"U+{codePoint:X}";
        }

        private string SafeTruncate(string text, int maxLength)
        {
            if (text.Length <= maxLength) return text;

            var truncated = text.Substring(0, maxLength);
            
            // Verificar se o último caractere é parte de um surrogate pair
            if (truncated.Length > 0 && char.IsHighSurrogate(truncated[truncated.Length - 1]))
            {
                truncated = truncated.Substring(0, truncated.Length - 1);
            }

            return truncated + "...";
        }

        private void ValidateProcessedText(EmojiProcessingResult result)
        {
            try
            {
                // Teste de serialização JSON
                JsonSerializer.Serialize(new { text = result.Processed });
                
                // Teste de encoding UTF-8
                var bytes = Encoding.UTF8.GetBytes(result.Processed);
                var decoded = Encoding.UTF8.GetString(bytes);
                
                if (!string.Equals(result.Processed, decoded, StringComparison.Ordinal))
                {
                    throw new InvalidOperationException("Encoding UTF-8 inválido após processamento");
                }
                
                // Verificar se não há surrogates órfãos
                if (HasOrphanSurrogates(result.Processed))
                {
                    throw new InvalidOperationException("Surrogates órfãos detectados após processamento");
                }

                result.Metadata.ValidatedAt = DateTime.UtcNow;

            }
            catch (Exception ex)
            {
                result.Safe = false;
                result.Issues.Add($"Validação final falhou: {ex.Message}");
            }
        }

        private string CreateFallbackText(string originalText)
        {
            // Texto de fallback extremamente seguro
            var fallback = Regex.Replace(originalText, @"[^\x00-\x7F]", "?"); // Manter apenas ASCII
            
            if (fallback.Length > 100)
                fallback = fallback.Substring(0, 100);
            
            return string.IsNullOrEmpty(fallback) ? "[Mensagem com caracteres especiais]" : fallback;
        }

        public EmojiProcessingStats GetStats() => _stats.Clone();
    }

    // === CLASSES DE DADOS ===

    public enum EmojiProcessingStrategy
    {
        Sanitize,       // Remove caracteres problemáticos
        Placeholder,    // Substitui emojis por placeholders textuais
        SafeEncoding,   // Aplica encoding seguro com validação
        Preserve,       // Preserva emojis com validação
        Hybrid          // Combina estratégias baseado no conteúdo
    }

    public class EmojiProcessingResult
    {
        public string Original { get; set; } = string.Empty;
        public string Processed { get; set; } = string.Empty;
        public bool Safe { get; set; } = true;
        public List<string> Issues { get; set; } = new();
        public EmojiProcessingMetadata Metadata { get; set; } = new();
    }

    public class EmojiProcessingMetadata
    {
        public int OriginalLength { get; set; }
        public bool HasEmojis { get; set; }
        public int EmojiCount { get; set; }
        public int EmojiPlaceholders { get; set; }
        public string Encoding { get; set; } = "utf8";
        public DateTime? ValidatedAt { get; set; }
    }

    public class TextAnalysis
    {
        public int Length { get; set; }
        public int ByteLength { get; set; }
        public bool HasEmojis { get; set; }
        public int EmojiCount { get; set; }
        public bool HasProblematicChars { get; set; }
        public bool CanSerializeJson { get; set; }
        public bool IsValidUtf8 { get; set; }
        public bool HasOrphanSurrogates { get; set; }
    }

    public class EmojiProcessingStats
    {
        public int Processed { get; set; }
        public int EmojisFound { get; set; }
        public int Sanitizations { get; set; }
        public int Fallbacks { get; set; }
        public int EncodingIssues { get; set; }

        public EmojiProcessingStats Clone() => new()
        {
            Processed = this.Processed,
            EmojisFound = this.EmojisFound,
            Sanitizations = this.Sanitizations,
            Fallbacks = this.Fallbacks,
            EncodingIssues = this.EncodingIssues
        };
    }
}
