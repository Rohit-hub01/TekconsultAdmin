using System;

namespace TekConsult.Services
{
    public interface IAgoraTokenService
    {
        string GenerateRtcToken(string channelName, string userId, uint expirationTimeInSeconds = 3600);
    }
}
