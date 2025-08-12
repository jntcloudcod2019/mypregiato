using Microsoft.AspNetCore.SignalR;

namespace Pregiato.API.Hubs
{
    public class WhatsAppHub : Hub
    {
        public async Task JoinWhatsAppGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "whatsapp");
            await Clients.Caller.SendAsync("JoinedWhatsAppGroup", "Conectado ao grupo WhatsApp");
        }

        public async Task LeaveWhatsAppGroup()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "whatsapp");
            await Clients.Caller.SendAsync("LeftWhatsAppGroup", "Desconectado do grupo WhatsApp");
        }
    }
} 