using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;

namespace Pregiato.Infrastructure.Data;

public class PregiatoDbContext : DbContext
{
    public PregiatoDbContext(DbContextOptions<PregiatoDbContext> options) : base(options)
    {
    }

            public DbSet<Talent> Talents { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<ContractTemplate> ContractTemplates { get; set; }
        public DbSet<FileUpload> FileUploads { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Operator> Operators { get; set; }
        public DbSet<QueueEvent> QueueEvents { get; set; }
        
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
            
            entity.Property(e => e.FullName)
                .IsRequired()
                .HasMaxLength(255);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);
            
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Document).IsUnique();
            
            entity.Property(e => e.Age)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        // Configuração da entidade Contract
        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.ContractType)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
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
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);
            
            entity.HasIndex(e => e.Email).IsUnique();
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
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

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.ContactId).IsRequired();
            entity.Property(e => e.Channel).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.Priority).IsRequired();
            entity.Property(e => e.CloseReason).HasMaxLength(500);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            
            // Relacionamentos
            entity.HasOne(e => e.Contact)
                .WithMany(c => c.Conversations)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Operator)
                .WithMany(u => u.AssignedConversations)
                .HasForeignKey(e => e.OperatorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.ConversationId).IsRequired();
            entity.Property(e => e.Direction).IsRequired();
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Body).IsRequired().HasMaxLength(4000);
            entity.Property(e => e.MediaUrl).HasMaxLength(500);
            entity.Property(e => e.FileName).HasMaxLength(100);
            entity.Property(e => e.ClientMessageId).HasMaxLength(50);
            entity.Property(e => e.WhatsAppMessageId).HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.InternalNote).HasMaxLength(500);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            
            // Relacionamento
            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Operator>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.HasIndex(e => e.Email).IsUnique();
            
            entity.Property(e => e.Role).IsRequired();
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.Skills).HasMaxLength(500);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<QueueEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            
            entity.Property(e => e.ConversationId).IsRequired();
            entity.Property(e => e.EventType).IsRequired();
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.TransferredTo).HasMaxLength(100);
            
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relacionamentos
            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.QueueEvents)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Operator)
                .WithMany(u => u.QueueEvents)
                .HasForeignKey(e => e.OperatorId)
                .OnDelete(DeleteBehavior.SetNull);
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
    }
} 