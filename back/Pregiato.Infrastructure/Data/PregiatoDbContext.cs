using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Enums;

namespace Pregiato.Infrastructure.Data;

public class PregiatoDbContext : DbContext
{
        public DbSet<Pregiato.Core.Entities.ModuleRecord> ModuleRecords { get; set; }
        public DbSet<ImportedFile> ImportedFiles { get; set; }
    public PregiatoDbContext(DbContextOptions<PregiatoDbContext> options) : base(options)
    {
    }

        public DbSet<Talent> Talent { get; set; }
        public DbSet<TalentDNA> TalentDNA { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<FileUpload> FileUploads { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<ChatSession> ChatSessions { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Operator> Operators { get; set; }
        public DbSet<QueueEvent> QueueEvents { get; set; }
        public DbSet<ChatLog> ChatLogs { get; set; }
        public DbSet<AttendanceTicket> AttendanceTickets { get; set; }
        
        // CRM Entities
        public DbSet<Lead> Leads { get; set; }
        public DbSet<LeadInteraction> LeadInteractions { get; set; }
        public DbSet<CrmTask> Tasks { get; set; }
        public DbSet<MetaIntegration> MetaIntegrations { get; set; }
        public DbSet<Campaign> Campaigns { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuração da entidade Talent
        modelBuilder.Entity<Talent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.ProducerId)
                .HasMaxLength(50);
            
            entity.Property(e => e.FullName)
                .IsRequired()
                .HasMaxLength(255);
            
            entity.Property(e => e.Email)
                .HasMaxLength(255);
            
            entity.Property(e => e.Phone)
                .HasMaxLength(20);
            
            entity.Property(e => e.Postalcode)
                .HasMaxLength(10);
            
            entity.Property(e => e.Street)
                .HasMaxLength(255);
            
            entity.Property(e => e.Neighborhood)
                .HasMaxLength(100);
            
            entity.Property(e => e.City)
                .HasMaxLength(100);
            
            entity.Property(e => e.NumberAddress)
                .HasMaxLength(20);
            
            entity.Property(e => e.Complement)
                .HasMaxLength(255);
            
            entity.Property(e => e.Uf)
                .HasMaxLength(2);
            
            entity.Property(e => e.Document)
                .HasMaxLength(20);
            
            entity.Property(e => e.Gender)
                .HasMaxLength(20);
            
            entity.Property(e => e.DnaStatus)
                .HasMaxLength(20)
                .HasDefaultValue("UNDEFINED");
            
            entity.Property(e => e.InviteToken)
                .HasMaxLength(255);
            
            entity.Property(e => e.ClerkInviteId)
                .HasMaxLength(255);
            
            entity.Property(e => e.InviteSentAt)
                .HasColumnType("datetime");
            
            // Índices
            entity.HasIndex(e => e.Email).IsUnique().HasFilter("\"Email\" IS NOT NULL");
            entity.HasIndex(e => e.Document).IsUnique().HasFilter("\"Document\" IS NOT NULL");
            
            entity.Property(e => e.Age)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        // Configuração da entidade TalentDNA
        modelBuilder.Entity<TalentDNA>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.TalentId)
                .IsRequired();
            
            entity.Property(e => e.Height)
                .HasMaxLength(191);
            
            entity.Property(e => e.Weight)
                .HasMaxLength(191);
            
            entity.Property(e => e.HairColor)
                .HasMaxLength(191);
            
            entity.Property(e => e.HairType)
                .HasMaxLength(191);
            
            entity.Property(e => e.HairLength)
                .HasMaxLength(191);
            
            entity.Property(e => e.EyeColor)
                .HasMaxLength(191);
            
            entity.Property(e => e.SkinTone)
                .HasMaxLength(191);
            
            entity.Property(e => e.ChestSize)
                .HasMaxLength(191);
            
            entity.Property(e => e.WaistSize)
                .HasMaxLength(191);
            
            entity.Property(e => e.HipSize)
                .HasMaxLength(191);
            
            entity.Property(e => e.ShoeSize)
                .HasMaxLength(191);
            
            entity.Property(e => e.DressSize)
                .HasMaxLength(191);
            
            entity.Property(e => e.PantsSize)
                .HasMaxLength(191);
            
            entity.Property(e => e.ShirtSize)
                .HasMaxLength(191);
            
            entity.Property(e => e.JacketSize)
                .HasMaxLength(191);
            
            entity.Property(e => e.FaceShape)
                .HasMaxLength(191);
            
            entity.Property(e => e.EthnicFeatures)
                .HasMaxLength(191);
            
            entity.Property(e => e.BodyType)
                .HasMaxLength(191);
            
            entity.Property(e => e.SpecialFeatures)
                .HasMaxLength(191);
            
            entity.Property(e => e.Accent)
                .HasMaxLength(191);
            
            entity.Property(e => e.Languages)
                .HasMaxLength(191);
            
            entity.Property(e => e.IntellectualDisability)
                .HasMaxLength(191);
            
            entity.Property(e => e.PhysicalDisability)
                .HasMaxLength(191);
            
            entity.Property(e => e.Religion)
                .HasMaxLength(191);
            
            entity.Property(e => e.TravelAvailability)
                .HasDefaultValue(false);
            
            entity.Property(e => e.VisualDisability)
                .HasMaxLength(191);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            
            // Relacionamento com Talent
            entity.HasOne(e => e.Talent)
                .WithOne(t => t.Dna)
                .HasForeignKey<TalentDNA>(e => e.TalentId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Índice único no TalentId
            entity.HasIndex(e => e.TalentId).IsUnique();
        });

                // Configuração da entidade Contract
        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.ContractId);
            entity.Property(e => e.ContractId).ValueGeneratedOnAdd();
            
            entity.Property(e => e.City)
                .HasMaxLength(100);
            
            entity.Property(e => e.Uf)
                .HasMaxLength(2);
            
            entity.Property(e => e.Day)
                .HasMaxLength(2);
            
            entity.Property(e => e.Month)
                .HasMaxLength(2);
            
            entity.Property(e => e.Year)
                .HasMaxLength(4);
            
            entity.Property(e => e.DurationContract)
                .HasMaxLength(50);
            
            entity.Property(e => e.ContractType)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.CodProducers)
                .HasMaxLength(100);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18,2)");
            
            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(50);
            
            entity.Property(e => e.PaymentStatus)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(20);
            
            entity.Property(e => e.ContractFilePath)
                .IsRequired()
                .HasMaxLength(500);
            
            entity.Property(e => e.Content)
                .HasColumnType("LONGBLOB");
            
            entity.Property(e => e.StatusContratc)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(StatusContratc.Active);
            
            entity.Property(e => e.TalentId)
                .HasColumnType("char(36)");
            
            entity.Property(e => e.TalentName)
                .HasMaxLength(255);
            
            entity.Property(e => e.LeadId)
                .HasColumnType("char(36)");
            
            // Relacionamento com Lead
            entity.HasOne(e => e.Lead)
                .WithMany(l => l.Contracts)
                .HasForeignKey(e => e.LeadId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Configuração da entidade ContractTemplate
        modelBuilder.Entity<ContractTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.HtmlContent)
                .IsRequired()
                .HasColumnType("LONGTEXT");
        });

        // Configuração da entidade FileUpload
        modelBuilder.Entity<FileUpload>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.FileName)
                .IsRequired()
                .HasMaxLength(255);
            
            entity.Property(e => e.FilePath)
                .IsRequired()
                .HasMaxLength(500);
            
            entity.Property(e => e.ContentType)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.FileSize)
                .IsRequired();
            
            entity.Property(e => e.UploadedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configuração da entidade User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.ClerkId)
                .IsRequired()
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.LastName)
                .IsRequired()
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.ImageUrl)
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.Role)
                .IsRequired()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            // Índices únicos
            entity.HasIndex(e => e.ClerkId).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Configuração da entidade Operator
        modelBuilder.Entity<Operator>(entity =>
        {
            entity.ToTable("Operators");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasColumnType("varchar(255)")
                .HasMaxLength(255);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasColumnType("varchar(255)")
                .HasMaxLength(255);
            
            entity.Property(e => e.Role)
                .IsRequired()
                .HasConversion<string>();
            
            entity.Property(e => e.Status)
                .IsRequired()
                .HasConversion<string>();
            
            entity.Property(e => e.Skills)
                .HasColumnType("text");
            
            entity.Property(e => e.MaxConcurrentConversations)
                .HasDefaultValue(5);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            entity.Property(e => e.LastActivityAt)
                .HasColumnType("datetime(3)");
            
            // Relacionamento removido para simplificar
            
            // Índice único no email
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Configuração das entidades WhatsApp
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.Phone)
                .IsRequired()
                .HasMaxLength(20);
            
            entity.HasIndex(e => e.Phone).IsUnique();
            
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.OriginCRM).HasMaxLength(50);
            entity.Property(e => e.Tags).HasMaxLength(500);
            entity.Property(e => e.BusinessName).HasMaxLength(100);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        // Configuração da entidade Conversation
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.ToTable("Conversations");
            entity.HasKey(e => e.Id);
            
            // Campos originais
            entity.Property(e => e.ContactId)
                .IsRequired();
            
            entity.Property(e => e.OperatorId)
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.Channel)
                .IsRequired()
                .HasColumnType("varchar(50)")
                .HasMaxLength(50);
            
            entity.Property(e => e.Status)
                .IsRequired()
                .HasConversion<string>();
            
            entity.Property(e => e.Priority)
                .IsRequired()
                .HasConversion<string>();
            
            entity.Property(e => e.CloseReason)
                .HasColumnType("varchar(500)")
                .HasMaxLength(500);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            entity.Property(e => e.AssignedAt)
                .HasColumnType("datetime(3)");
            
            entity.Property(e => e.ClosedAt)
                .HasColumnType("datetime(3)");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            // Novos campos para WhatsApp
            entity.Property(e => e.InstanceId)
                .HasColumnType("varchar(128)")
                .HasMaxLength(128);
            
            entity.Property(e => e.PeerE164)
                .HasColumnType("varchar(64)")
                .HasMaxLength(64);
            
            entity.Property(e => e.IsGroup)
                .HasDefaultValue(false);
            
            entity.Property(e => e.Title)
                .HasColumnType("varchar(256)")
                .HasMaxLength(256);
            
            entity.Property(e => e.CurrentSessionId);
            
            entity.Property(e => e.LastMessageAt)
                .HasColumnType("datetime");
            
            // Relacionamentos originais
            entity.HasOne(e => e.Contact)
                .WithMany(c => c.Conversations)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Operator)
                .WithMany()
                .HasForeignKey(e => e.OperatorId);
            
            // Índice único para evitar duplicação de conversas WhatsApp (apenas quando ambos campos estão preenchidos)
            entity.HasIndex(e => new { e.InstanceId, e.PeerE164 })
                .IsUnique()
                .HasFilter("[InstanceId] IS NOT NULL AND [PeerE164] IS NOT NULL");
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.ToTable("ChatSessions");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.ConversationId)
                .IsRequired();
            
            entity.Property(e => e.OpenedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.ClosedAt)
                .HasColumnType("datetime");
            
            entity.Property(e => e.OpenedBy)
                .HasColumnType("varchar(128)")
                .HasMaxLength(128);
            
            entity.Property(e => e.ClosedBy)
                .HasColumnType("varchar(128)")
                .HasMaxLength(128);
            
            // Relacionamentos
            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.Sessions)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Índice para consultas por conversa e data de abertura
            entity.HasIndex(e => new { e.ConversationId, e.OpenedAt });
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.ConversationId).IsRequired();
            entity.Property(e => e.SessionId);
            entity.Property(e => e.ExternalMessageId).HasMaxLength(128);
            entity.Property(e => e.Direction).IsRequired();
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Body).IsRequired().HasMaxLength(4000);
            entity.Property(e => e.MediaUrl).HasMaxLength(500);
            entity.Property(e => e.FileName).HasMaxLength(100);
            entity.Property(e => e.ClientMessageId).HasMaxLength(50);
            entity.Property(e => e.WhatsAppMessageId).HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.InternalNote).HasMaxLength(500);
            
            // Campo para armazenar o payload completo da mensagem
            entity.Property(e => e.PayloadJson).HasColumnType("LONGTEXT");
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            
            // Relacionamentos
            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Session)
                .WithMany(s => s.Messages)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.SetNull);
            
            // Índices para consultas eficientes
            entity.HasIndex(e => new { e.ConversationId, e.CreatedAt });
            
            // Índice único para evitar duplicação de mensagens
            entity.HasIndex(e => new { e.ConversationId, e.ExternalMessageId })
                .IsUnique()
                .HasFilter("[ConversationId] IS NOT NULL AND [ExternalMessageId] IS NOT NULL");
        });

        // Configuração da entidade QueueEvent
        modelBuilder.Entity<QueueEvent>(entity =>
        {
            entity.ToTable("QueueEvents");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.ConversationId)
                .IsRequired();
            
            entity.Property(e => e.OperatorId)
                .HasColumnType("varchar(191)")
                .HasMaxLength(191);
            
            entity.Property(e => e.EventType)
                .IsRequired()
                .HasConversion<string>();
            
            entity.Property(e => e.Reason)
                .HasColumnType("varchar(500)")
                .HasMaxLength(500);
            
            entity.Property(e => e.TransferredTo)
                .HasColumnType("varchar(100)")
                .HasMaxLength(100);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime(3)")
                .HasDefaultValueSql("CURRENT_TIMESTAMP(3)");
            
            // Relacionamentos
            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.QueueEvents)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChatLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ContactPhoneE164).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.ContactPhoneE164).IsUnique();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(150);
            entity.Property(e => e.PayloadJson).IsRequired().HasColumnType("LONGTEXT");
            entity.Property(e => e.UnreadCount).IsRequired();
            entity.Property(e => e.LastMessageAt).HasColumnType("datetime");
            entity.Property(e => e.LastMessagePreview).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            
            // Novos campos adicionados
            entity.Property(e => e.ChatId);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.MessageId).HasMaxLength(50);
            entity.Property(e => e.Direction).HasMaxLength(10);
            entity.Property(e => e.Content).HasColumnType("TEXT");
            entity.Property(e => e.ContentType).HasMaxLength(20);
            entity.Property(e => e.Timestamp).HasColumnType("datetime");
            entity.Property(e => e.LastMessageUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<AttendanceTicket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.HasIndex(e => e.ChatLogId);
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.Description).HasColumnType("LONGTEXT");
            entity.Property(e => e.CreatedAtUtc).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            entity.HasOne(e => e.ChatLog)
                  .WithMany()
                  .HasForeignKey(e => e.ChatLogId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuração das entidades CRM
        modelBuilder.Entity<Lead>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.MetaLeadId);
            
            entity.Property(e => e.Phone)
                .IsRequired()
                .HasMaxLength(20);
            
            entity.Property(e => e.Company).HasMaxLength(100);
            entity.Property(e => e.Position).HasMaxLength(100);
            entity.Property(e => e.Industry).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Source).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.AssignedTo).HasMaxLength(100);
            entity.Property(e => e.Tags).HasMaxLength(500);
            entity.Property(e => e.Priority).HasMaxLength(50);
            entity.Property(e => e.MetaLeadId).HasMaxLength(100);
            entity.Property(e => e.MetaAdId).HasMaxLength(100);
            entity.Property(e => e.MetaCampaignId).HasMaxLength(100);
            entity.Property(e => e.MetaFormId).HasMaxLength(100);
            
            entity.Property(e => e.EstimatedValue)
                .HasColumnType("decimal(18,2)");
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<LeadInteraction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.LeadId).IsRequired();
            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.Subject)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Outcome).HasMaxLength(100);
            entity.Property(e => e.PerformedBy).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.Duration).HasMaxLength(100);
            entity.Property(e => e.Location).HasMaxLength(100);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relacionamento
            entity.HasOne(e => e.Lead)
                .WithMany(l => l.Interactions)
                .HasForeignKey(e => e.LeadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CrmTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.AssignedTo).HasMaxLength(100);
            entity.Property(e => e.Priority).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.EstimatedDuration).HasMaxLength(100);
            entity.Property(e => e.ActualDuration).HasMaxLength(100);
            entity.Property(e => e.RecurrencePattern).HasMaxLength(50);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            
            // Relacionamento
            entity.HasOne(e => e.Lead)
                .WithMany(l => l.Tasks)
                .HasForeignKey(e => e.LeadId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MetaIntegration>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.Platform)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.AccessToken)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.PageId).HasMaxLength(100);
            entity.Property(e => e.BusinessId).HasMaxLength(100);
            entity.Property(e => e.AppId).HasMaxLength(100);
            entity.Property(e => e.AppSecret).HasMaxLength(100);
            entity.Property(e => e.WebhookVerifyToken).HasMaxLength(100);
            entity.Property(e => e.WebhookUrl).HasMaxLength(500);
            entity.Property(e => e.LastError).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Permissions).HasMaxLength(1000);
            entity.Property(e => e.RefreshToken).HasMaxLength(500);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.Platform).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.AssignedTo).HasMaxLength(100);
            entity.Property(e => e.TargetAudience).HasMaxLength(500);
            entity.Property(e => e.Goals).HasMaxLength(500);
            entity.Property(e => e.KPIs).HasMaxLength(500);
            entity.Property(e => e.MetaCampaignId).HasMaxLength(100);
            entity.Property(e => e.MetaAdSetId).HasMaxLength(100);
            entity.Property(e => e.MetaAdId).HasMaxLength(100);
            entity.Property(e => e.MetaCreativeUrl).HasMaxLength(500);
            entity.Property(e => e.MetaCreativeText).HasMaxLength(1000);
            
            entity.Property(e => e.Budget)
                .HasColumnType("decimal(18,2)");
            
            entity.Property(e => e.Spent)
                .HasColumnType("decimal(18,2)");
            
            entity.Property(e => e.CTR)
                .HasColumnType("decimal(5,2)");
            
            entity.Property(e => e.CPC)
                .HasColumnType("decimal(10,2)");
            
            entity.Property(e => e.CPM)
                .HasColumnType("decimal(10,2)");
            
            entity.Property(e => e.CPA)
                .HasColumnType("decimal(10,2)");
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });
            modelBuilder.Entity<Pregiato.Core.Entities.ModuleRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.ModuleSlug).IsRequired().HasMaxLength(80);
                entity.Property(e => e.Title).HasMaxLength(180);
                entity.Property(e => e.Status).HasMaxLength(60);
                entity.Property(e => e.Tags).HasMaxLength(180);
                entity.Property(e => e.PayloadJson).IsRequired().HasColumnType("LONGTEXT");
                entity.Property(e => e.CreatedAtUtc).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                entity.Property(e => e.RowVersion).IsRowVersion();
                entity.HasIndex(e => e.ModuleSlug);
            });

            modelBuilder.Entity<ImportedFile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.FileName).HasMaxLength(200);
                entity.Property(e => e.PayloadJson).HasColumnType("LONGTEXT");
                entity.Property(e => e.CreatedAtUtc).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            });
    }
} 