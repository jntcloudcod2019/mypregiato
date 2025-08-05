using Microsoft.AspNetCore.SignalR;

namespace Pregiato.API.Hubs
{
    public class WhatsAppHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
} 