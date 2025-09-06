using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    /// <summary>
    /// Entidade para armazenar informações da seletiva em formato JSON
    /// </summary>
    public class SeletivaInfo
    {
        /// <summary>
        /// Data da seletiva
        /// </summary>
        public DateTime? DateSeletiva { get; set; }
        
        /// <summary>
        /// Local da seletiva - CEP, rua com número, bairro, cidade, estado
        /// </summary>
        [MaxLength(500)]
        public string? LocalSeletiva { get; set; }
        
        /// <summary>
        /// Horário agendado para o lead
        /// </summary>
        public TimeSpan? HorarioAgendadoLead { get; set; }
        
        /// <summary>
        /// Nome do lead
        /// </summary>
        [MaxLength(500)]
        public string? NomeLead { get; set; }
        
        /// <summary>
        /// Código do operador que agendou
        /// </summary>
        [MaxLength(255)]
        public string? CodOperator { get; set; }
    }
}
