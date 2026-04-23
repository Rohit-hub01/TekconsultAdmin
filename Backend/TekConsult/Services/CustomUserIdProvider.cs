using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace TekConsult.Services
{
    public class CustomUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            // Prefer NameIdentifier claim; fall back to "userId" claim if present
            return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? connection.User?.FindFirst("userId")?.Value;
        }
    }
}