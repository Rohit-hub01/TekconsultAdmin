using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace TekConsult.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        // Hub can be empty if we only use it for server-to-client notifications
    }
}
