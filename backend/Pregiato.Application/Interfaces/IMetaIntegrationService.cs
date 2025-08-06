using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface IMetaIntegrationService
    {
        Task<bool> ConnectAsync(string accessToken, string platform);
        Task<bool> DisconnectAsync(string platform);
        Task<object> GetConnectionStatusAsync(string platform);
        Task<object> GetAccountInfoAsync(string platform);
        
        // Lead Generation
        Task<IEnumerable<LeadDto>> SyncLeadsFromMetaAsync(string platform);
        Task<LeadDto> CreateLeadFromMetaAsync(string metaLeadId, string platform);
        Task<bool> UpdateLeadInMetaAsync(Guid leadId, string platform);
        
        // Campaign Management
        Task<object> GetCampaignsAsync(string platform);
        Task<object> CreateCampaignAsync(object campaignData, string platform);
        Task<object> UpdateCampaignAsync(string campaignId, object campaignData, string platform);
        Task<bool> DeleteCampaignAsync(string campaignId, string platform);
        
        // Ad Management
        Task<object> GetAdsAsync(string platform);
        Task<object> CreateAdAsync(object adData, string platform);
        Task<object> UpdateAdAsync(string adId, object adData, string platform);
        Task<bool> DeleteAdAsync(string adId, string platform);
        
        // Analytics
        Task<object> GetCampaignAnalyticsAsync(string campaignId, string platform);
        Task<object> GetAdAnalyticsAsync(string adId, string platform);
        Task<object> GetLeadAnalyticsAsync(string platform);
        
        // Webhook Management
        Task<bool> SetupWebhookAsync(string platform, string webhookUrl);
        Task<bool> VerifyWebhookAsync(string platform, string verifyToken);
        Task<object> ProcessWebhookAsync(string platform, object webhookData);
        
        // Form Management
        Task<object> GetFormsAsync(string platform);
        Task<object> CreateFormAsync(object formData, string platform);
        Task<object> UpdateFormAsync(string formId, object formData, string platform);
        Task<bool> DeleteFormAsync(string formId, string platform);
    }
} 