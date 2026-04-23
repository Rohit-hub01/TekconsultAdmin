using Microsoft.Extensions.Configuration;
using System;
using TekConsult.Common;

namespace TekConsult.Services
{
    public class AgoraSettings
    {
        public string AppId { get; set; } = string.Empty;
        public string AppCertificate { get; set; } = string.Empty;
    }

    public class AgoraTokenService : IAgoraTokenService
    {
        private readonly AgoraSettings _settings;

        public AgoraTokenService(IConfiguration configuration)
        {
            _settings = new AgoraSettings();
            configuration.GetSection("Agora").Bind(_settings);
        }

        public string GenerateRtcToken(string channelName, string userId, uint expirationTimeInSeconds = 3600)
        {
            if (string.IsNullOrEmpty(_settings.AppId) || _settings.AppId == "YOUR_AGORA_APP_ID" ||
                string.IsNullOrEmpty(_settings.AppCertificate) || _settings.AppCertificate == "YOUR_AGORA_APP_CERTIFICATE")
            {
                // Return a mock token for development if no real credentials provided
                return $"MOCK_TOKEN_{channelName}_{userId}_{DateTime.UtcNow.Ticks}";
            }

            try
            {
                // Align UID logic with frontend (VoiceCallManager.tsx)
                // The frontend uses: const numericUid = uid.split('-').join('').slice(0, 8);
                // And joins with parseInt(numericUid, 16).
                string uidStr = userId;
                if (userId.Contains("-"))
                {
                    var numericUidPart = userId.Replace("-", "").Substring(0, 8);
                    var numericUid = Convert.ToUInt32(numericUidPart, 16);
                    uidStr = numericUid.ToString();
                }

                uint expireTimestamp = (uint)(DateTimeOffset.UtcNow.ToUnixTimeSeconds() + expirationTimeInSeconds);
                
                return AgoraTokenBuilder.BuildRrtcToken(
                    _settings.AppId, 
                    _settings.AppCertificate, 
                    channelName, 
                    uidStr, 
                    expireTimestamp);
            }
            catch (Exception ex)
            {
                // Log and fallback to mock if something goes wrong
                Console.WriteLine($"Error generating Agora token: {ex.Message}");
                return $"MOCK_TOKEN_{channelName}_{userId}_{DateTime.UtcNow.Ticks}";
            }
        }
    }
}
